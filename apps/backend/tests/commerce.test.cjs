const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { disconnectDB } = require('../dist/config/database');
const request = require('supertest');
const jwt = require('jsonwebtoken');
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to an isolated PostgreSQL test database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.REDIS_URL = '';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
process.env.SESSION_SECRET = crypto.randomBytes(48).toString('hex');
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';
const app = require('../dist/index').default;
const { User } = require('../dist/models/user.model');
const { Store } = require('../dist/models/store.model');
const { Product } = require('../dist/models/product.model');
const { Category } = require('../dist/models/category.model');
const { Order } = require('../dist/models/order.model');
const { Transaction } = require('../dist/models/transaction.model');
const { Otp } = require('../dist/models/otp.model');
const { issueOtp, consumeOtp } = require('../dist/services/otp.service');
const { finalizeCapturedPayment } = require('../dist/services/order-fulfillment.service');
const { mailService } = require('../dist/services/mail.service');
mailService.sendOtp = mailService.sendOrderConfirmation = mailService.sendOrderStatusUpdate = async () => {};
let repl, store, product, customer, token, otherToken, category;
const makeToken = user => jwt.sign({ id: String(user._id), email: user.email, role: user.role }, process.env.JWT_SECRET);
const address = { firstName:'Test',lastName:'Buyer',addressLine1:'Test address only',city:'Shimla',state:'Himachal Pradesh',pincode:'171001',country:'India' };
const payload = (extra={}) => ({storeId:String(store._id),items:[{productId:String(product._id),quantity:1}],customer:{firstName:'Test',lastName:'Buyer',email:customer.email,phone:'9999999999'},shippingAddress:address,billingAddress:address,paymentMethod:'razorpay',checkoutKey:crypto.randomUUID(),...extra});
const create = body => request(app).post('/api/v1/orders').set('Authorization',`Bearer ${token}`).send(body);
before(async()=>{
 const { sql } = require('drizzle-orm');
 const { getDB } = require('../dist/config/database');
 const { migrate } = require('drizzle-orm/node-postgres/migrator');
 await migrate(getDB(), { migrationsFolder: require('node:path').join(__dirname, '../drizzle') });
 await getDB().execute(sql`TRUNCATE TABLE "order", "user", store, product, category, transaction, otp, page, billboard, newsletter_subscriber, product_variant CASCADE`);
 customer=await User.create({email:'buyer@example.test',name:'Test',password:'unused',role:'customer',emailVerified:true});
 const other=await User.create({email:'other@example.test',name:'Other',password:'unused',role:'customer',emailVerified:true});
 token=makeToken(customer);otherToken=makeToken(other);
 store=await Store.create({name:'Test store',slug:'test-store',isActive:true});
 category=await Category.create({storeId:String(store._id),name:'Test',slug:'test',isActive:true});
 product=await Product.create({storeId:String(store._id),name:'Test product',slug:'test-product',description:'Actual description',featuredImage:'https://example.test/product.jpg',mrp:100,sellingPrice:100,stock:20,isActive:true,categoryId:String(category._id)});
});
after(async()=>{await disconnectDB()});
test('registration ignores attacker-supplied elevated roles and requires verified email',async()=>{
 const noCode=await request(app).post('/api/v1/users/register').send({email:'attack@example.test',name:'Test',password:'test-password-123',role:'admin'});assert.equal(noCode.status,400);
 const otp=await issueOtp('signup@example.test');
 const result=await request(app).post('/api/v1/users/register').send({email:'signup@example.test',name:'Test',password:'test-password-123',role:'admin',otp});
 assert.equal(result.status,201);assert.equal(result.body.data.user.role,'customer');
});
test('OTP storage is hashed, resends throttled, attempts bounded and consumption atomic',async()=>{
 const email='otp@example.test',code=await issueOtp(email);assert.notEqual((await Otp.findOne({email})).otp,code);
 await assert.rejects(issueOtp(email),/Wait one minute/);
 const results=await Promise.allSettled([consumeOtp(email,code),consumeOtp(email,code)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 const locked='locked@example.test',lockedCode=await issueOtp(locked);
 for(let i=0;i<5;i++)await assert.rejects(consumeOtp(locked,'000000'));
 await assert.rejects(consumeOtp(locked,lockedCode));
});
test('customer cannot upload media, access someone else’s order, or change identity',async()=>{
 assert.equal((await request(app).post('/api/v1/media/presigned-url').set('Authorization',`Bearer ${token}`).send({})).status,403);
 assert.equal((await request(app).put('/api/v1/users/profile').set('Authorization',`Bearer ${token}`).send({email:'other@example.test'})).status,400);
 const made=await create(payload());assert.equal(made.status,201);
 assert.equal((await request(app).get(`/api/v1/orders/${made.body.data._id}`).set('Authorization',`Bearer ${otherToken}`)).status,403);
 assert.equal((await request(app).get(`/api/v1/orders/track/${made.body.data._id}?email=${customer.email}`)).status,401);
});
test('checkout validates identity, variants and quantity before any stock change',async()=>{
 const before=(await Product.findById(product._id)).stock;
 assert.equal((await create(payload({customer:{...payload().customer,email:'other@example.test'}}))).status,403);
 assert.equal((await create(payload({items:[{productId:String(product._id),quantity:-1}],paymentMethod:'cod'}))).status,400);
 await Product.updateOne({_id:product._id},{$set:{hasVariants:true}});
 assert.equal((await create(payload())).status,400);
 await Product.updateOne({_id:product._id},{$set:{hasVariants:false}});
 assert.equal((await Product.findById(product._id)).stock,before);
});
test('concurrent retries create exactly one COD order and use server pricing',async()=>{
 const before=(await Product.findById(product._id)).stock,body=payload({paymentMethod:'cod',total:1});
 const results=await Promise.all([create(body),create(body)]);for(const r of results)assert.ok([200,201].includes(r.status),JSON.stringify(r.body));
 assert.equal(results[0].body.data._id,results[1].body.data._id);assert.equal(results[0].body.data.total,199);
 assert.equal((await Product.findById(product._id)).stock,before-1);
});
test('two buyers racing for last stock cannot oversell',async()=>{
 await Product.updateOne({_id:product._id},{$set:{stock:1}});
 const results=await Promise.all([create(payload({paymentMethod:'cod'})),create(payload({paymentMethod:'cod'}))]);
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal((await Product.findById(product._id)).stock,0);
 await Product.updateOne({_id:product._id},{$set:{stock:20}});
});
test('capture after failure and duplicate concurrent captures settle exactly once',async()=>{
 const made=await create(payload()),id=made.body.data._id,before=(await Product.findById(product._id)).stock;
 const transaction=await Transaction.create({orderId:id,storeId:String(store._id),razorpayOrderId:'order_retry',amount:199,currency:'INR',status:'failed'});
 await Order.updateOne({_id:id},{$set:{paymentStatus:'failed'}});
 const values={razorpayOrderId:'order_retry',razorpayPaymentId:'pay_retry',amount:19900,currency:'INR'};
 const results=await Promise.all([finalizeCapturedPayment(values),finalizeCapturedPayment(values)]);
 assert.deepEqual(results.map(r=>r.state).sort(),['already_fulfilled','fulfilled']);assert.equal((await Product.findById(product._id)).stock,before-1);assert.equal((await Order.findById(id)).paymentStatus,'paid');
 const webhook={event:'payment.failed',payload:{payment:{entity:{order_id:'order_retry',id:'pay_failed',error_code:'BAD_REQUEST'}}}};
 const raw=JSON.stringify(webhook),signature=crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
 assert.equal((await request(app).post('/api/v1/payment/webhook').set('x-razorpay-signature',signature).set('Content-Type','application/json').send(raw)).status,200);
 assert.equal((await Transaction.findById(transaction._id)).status,'captured');assert.equal((await Order.findById(id)).paymentStatus,'paid');
});
test('failed inventory reconciliation rolls back all stock while recording captured money',async()=>{
 const made=await create(payload());await Product.updateOne({_id:product._id},{$set:{stock:0}});
 await Transaction.create({orderId:made.body.data._id,storeId:String(store._id),razorpayOrderId:'order_review',amount:199,currency:'INR',status:'created'});
 const result=await finalizeCapturedPayment({razorpayOrderId:'order_review',razorpayPaymentId:'pay_review',amount:19900,currency:'INR'});
 assert.equal(result.state,'manual_review');assert.equal(result.order.paymentStatus,'paid');assert.equal(result.order.inventoryStatus,'review');assert.equal((await Product.findById(product._id)).stock,0);
});
test('draft products stay private even with includeInactive=true',async()=>{
 await Product.updateOne({_id:product._id},{$set:{isActive:false}});
 const result=await request(app).get(`/api/v1/stores/${store._id}/products?includeInactive=true&isFeatured=false`);
 assert.equal(result.status,200);assert.equal(result.body.data.data.length,0);
 assert.equal((await request(app).get(`/api/v1/stores/${store._id}/products/${product._id}`)).status,404);
});
test('store managers cannot move products into another tenant and unsafe variants are rejected',async()=>{
 const owner=await User.create({email:'owner@example.test',name:'Owner',password:'unused',role:'store_owner',emailVerified:true});
 const ownerToken=makeToken(owner);await Store.updateOne({_id:store._id},{$set:{owner:String(owner._id)}});
 const foreignStore=await Store.create({name:'Foreign',slug:'foreign'});
 const foreign=await Category.create({storeId:foreignStore._id,name:'Foreign',slug:'foreign'});
 assert.equal((await request(app).put(`/api/v1/stores/${store._id}/products/${product._id}`).set('Authorization',`Bearer ${ownerToken}`).send({categoryId:String(foreign._id)})).status,400);
 assert.equal((await request(app).post(`/api/v1/products/${product._id}/variants`).set('Authorization',`Bearer ${ownerToken}`).send({name:'Bad',sku:'bad',price:1,stock:0.5,attributes:{}})).status,400);
 assert.equal((await request(app).get(`/api/v1/products/${product._id}/variants`).set('Authorization',`Bearer ${token}`)).status,404);
 assert.equal((await request(app).delete(`/api/v1/stores/${store._id}`).set('Authorization',`Bearer ${ownerToken}`)).status,409);
});
test('order transitions reject skipping fulfillment and cancellation restores inventory once',async()=>{
 await Product.updateOne({_id:product._id},{$set:{isActive:true,stock:10}});
 const owner=await User.findOne({email:'owner@example.test'}), ownerToken=makeToken(owner);
 const made=await create(payload({paymentMethod:'cod'})); assert.equal(made.status,201);
 const url=`/api/v1/orders/${made.body.data._id}/status`;
 assert.equal((await request(app).put(url).set('Authorization',`Bearer ${ownerToken}`).send({status:'delivered'})).status,409);
 assert.equal((await request(app).put(url).set('Authorization',`Bearer ${ownerToken}`).send({status:'cancelled'})).status,200);
 assert.equal((await Product.findById(product._id)).stock,10);
 await request(app).put(url).set('Authorization',`Bearer ${ownerToken}`).send({status:'cancelled'});
 assert.equal((await Product.findById(product._id)).stock,10);
});
test('tampered webhook fails and checkout key cannot be reused for a different basket',async()=>{
 assert.equal((await request(app).post('/api/v1/payment/webhook').set('x-razorpay-signature','bad').send({event:'payment.captured'})).status,400);
 const body=payload();assert.equal((await create(body)).status,201);
 assert.equal((await create({...body,items:[{productId:String(product._id),quantity:2}]})).status,409);
});
test('processed full refund restores undispatched stock once, including duplicate webhook delivery',async()=>{
 const {PaymentService}=require('../dist/services/payment.service');
 const made=await create(payload()), before=(await Product.findById(product._id)).stock;
 await Transaction.create({orderId:made.body.data._id,storeId:String(store._id),razorpayOrderId:'order_refund',amount:199,currency:'INR',status:'created'});
 await finalizeCapturedPayment({razorpayOrderId:'order_refund',razorpayPaymentId:'pay_refund',amount:19900,currency:'INR'});
 assert.equal((await Product.findById(product._id)).stock,before-1);
 const original=PaymentService.fetchPayment;PaymentService.fetchPayment=async()=>({refund_status:'full',amount_refunded:19900});
 try{
 const raw=JSON.stringify({event:'refund.processed',payload:{refund:{entity:{id:'rfnd_test',payment_id:'pay_refund',status:'processed'}}}});
 const signature=crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
 for(let i=0;i<2;i++)assert.equal((await request(app).post('/api/v1/payment/webhook').set('x-razorpay-signature',signature).set('Content-Type','application/json').send(raw)).status,200);
 assert.equal((await Product.findById(product._id)).stock,before);assert.equal((await Order.findById(made.body.data._id)).paymentStatus,'refunded');
 }finally{PaymentService.fetchPayment=original;}
});
test('definitive refund rejection unlocks the request and records an actionable error',async()=>{
 const {PaymentService}=require('../dist/services/payment.service');const {AppError}=require('../dist/middleware/error-handler');
 const made=await create(payload());await Transaction.create({orderId:made.body.data._id,storeId:String(store._id),razorpayOrderId:'order_rejected_refund',amount:199,currency:'INR',status:'created'});
 await finalizeCapturedPayment({razorpayOrderId:'order_rejected_refund',razorpayPaymentId:'pay_rejected_refund',amount:19900,currency:'INR'});
 const transaction=await Transaction.findOne({razorpayOrderId:'order_rejected_refund'}),owner=await User.findOne({email:'owner@example.test'});
 const original=PaymentService.createRefund;PaymentService.createRefund=async()=>{throw new AppError('Provider rejected the refund',400)};
 try{assert.equal((await request(app).post('/api/v1/payment/refund').set('Authorization',`Bearer ${makeToken(owner)}`).send({transactionId:String(transaction._id)})).status,400);
 const updated=await Transaction.findById(transaction._id);assert.equal(updated.refundPending,false);assert.match(updated.refundError,/rejected/);assert.equal(updated.status,'captured');}finally{PaymentService.createRefund=original;}
});
test('page home selection is transactional and JSON addresses remain editable', async () => {
 const {Page}=require('../dist/models/page.model');
 const root=await Category.create({storeId:store._id,name:'Root',slug:'root-empty-parent',parentId:''});assert.equal((await Category.findById(root._id)).parentId,undefined);
 const a=await Page.create({storeId:store._id,title:'First',slug:'first',isHomePage:true});
 const b=await Page.create({storeId:store._id,title:'Second',slug:'second',isHomePage:true});
 assert.equal((await Page.findById(a._id)).isHomePage,false);assert.equal((await Page.findById(b._id)).isHomePage,true);
 await Page.findByIdAndUpdate(a._id,{$set:{isHomePage:true}});
 assert.equal((await Page.findById(b._id)).isHomePage,false);
 await User.updateOne({_id:customer._id},{$set:{addresses:[{...address,address1:'Test address',postalCode:'171001'}]}});
 const saved=await User.findById(customer._id);assert.match(saved.addresses[0]._id,/^[a-f0-9]{24}$/);
 await Order.updateMany({'customer.email':customer.email},{$set:{'customer.userId':customer._id}});
 assert.ok(await Order.exists({'customer.userId':customer._id}));
});
test('Shiprocket creation is authorized, idempotent, and blocks unsafe cancellation',async()=>{
 const service=require('../dist/services/shiprocket.service');
 const {getDB}=require('../dist/config/database');const {ShipmentTable}=require('../dist/db/schema');
 const {eq}=require('drizzle-orm');
 process.env.SHIPROCKET_EMAIL='api@example.com';process.env.SHIPROCKET_PASSWORD='mock-password';
 const original=service.shiprocketRequest;let calls=0;
 service.shiprocketRequest=async()=>{calls++;return {order_id:98765,shipment_id:76543}};
 try {
  const owner=await User.findOne({email:'owner@example.test'}),ownerToken=makeToken(owner);
  const made=await create(payload({paymentMethod:'cod'}));assert.equal(made.status,201);
  const id=made.body.data._id,url=`/api/v1/orders/${id}/shipment`;
  const parcel={pickupLocation:'Warehouse',pickupPincode:'171001',weight:0.5,length:10,breadth:10,height:5};
  assert.equal((await request(app).post(url).set('Authorization',`Bearer ${token}`).send(parcel)).status,403);
  const results=await Promise.all([1,2].map(()=>request(app).post(url).set('Authorization',`Bearer ${ownerToken}`).send(parcel)));
  assert.ok(results.every(r=>[200,201,409].includes(r.status)),JSON.stringify(results.map(r=>r.body)));assert.equal(calls,1);
  assert.equal((await request(app).put(`/api/v1/orders/${id}/status`).set('Authorization',`Bearer ${ownerToken}`).send({status:'cancelled'})).status,409);
  assert.equal((await request(app).get(url).set('Authorization',`Bearer ${otherToken}`)).status,403);
  let assignments=0;
  service.shiprocketRequest=async endpoint=>{
   if(endpoint.endsWith('/awb')){assignments++;return {awb_assign_status:1,response:{data:{awb_code:'MOCKAWB',courier_name:'Mock courier'}}};}
   if(endpoint.endsWith('/pickup'))return {pickup_status:1};
   if(endpoint.endsWith('/label'))return {label_url:'https://example.test/label.pdf'};
   throw new Error('Unexpected shipping endpoint');
  };
  const shipAction=(kind,body={})=>request(app).post(`${url}/${kind}`).set('Authorization',`Bearer ${ownerToken}`).send(body);
  assert.equal((await shipAction('assign',{courierId:1})).status,200);
  assert.equal((await shipAction('assign',{courierId:1})).status,200);assert.equal(assignments,1);
  const fulfillment=(await Order.findById(id)).fulfillment;assert.equal(fulfillment.trackingNumber,'MOCKAWB');assert.equal(fulfillment.carrier,'Mock courier');assert.match(fulfillment.trackingUrl,/MOCKAWB/);
  assert.equal((await shipAction('pickup')).status,200);
  assert.equal((await shipAction('label')).status,200);

  await getDB().update(ShipmentTable).set({state:'cancelled'}).where(eq(ShipmentTable.orderId,id));
  assert.equal((await request(app).put(`/api/v1/orders/${id}/status`).set('Authorization',`Bearer ${ownerToken}`).send({status:'cancelled'})).status,200);
 } finally {service.shiprocketRequest=original;}
});
test('uncertain shipment creation cannot create duplicate provider orders',async()=>{
 const service=require('../dist/services/shiprocket.service'),original=service.shiprocketRequest;let calls=0;
 service.shiprocketRequest=async()=>{calls++;throw new Error('simulated timeout')};
 try {
  const ownerToken=makeToken(await User.findOne({email:'owner@example.test'}));
  const made=await create(payload({paymentMethod:'cod'}));const url=`/api/v1/orders/${made.body.data._id}/shipment`;
  const parcel={pickupLocation:'Warehouse',pickupPincode:'171001',weight:0.5,length:10,breadth:10,height:5};
  assert.equal((await request(app).post(url).set('Authorization',`Bearer ${ownerToken}`).send(parcel)).status,500);
  assert.equal((await request(app).post(url).set('Authorization',`Bearer ${ownerToken}`).send(parcel)).status,409);assert.equal(calls,1);
 }finally {service.shiprocketRequest=original;}
});
test('shipping webhooks authenticate and do not regress delivered orders',async()=>{
 const {getDB}=require('../dist/config/database');const {ShipmentTable}=require('../dist/db/schema');
 const made=await create(payload({paymentMethod:'cod'}));const id=made.body.data._id;
 await getDB().insert(ShipmentTable).values({orderId:id,providerOrderId:'123456',providerShipmentId:'123457',state:'created',awb:'TESTAWB',parcel:{}});
 process.env.SHIPROCKET_WEBHOOK_SECRET=crypto.randomBytes(32).toString('hex');
 const body={sr_order_id:123456,awb:'TESTAWB',current_status:'DELIVERED',current_timestamp:'09 09 2026 12:00:00'};
 assert.equal((await request(app).post('/api/v1/delivery/events').send(body)).status,401);
 const send=data=>request(app).post('/api/v1/delivery/events').set('x-api-key',process.env.SHIPROCKET_WEBHOOK_SECRET).send(data);
 assert.equal((await send(body)).status,200);assert.equal((await send({...body,current_status:'IN TRANSIT',current_timestamp:'08 09 2026 12:00:00'})).status,200);
 const updated=await Order.findById(id);assert.equal(updated.status,'delivered');assert.equal(updated.paymentStatus,'paid');
 assert.equal(updated.statusHistory.filter(h=>h.status==='delivered').length,1);
});
test('Redis caches only public catalog, invalidates on writes, and survives cache outages', {skip:!process.env.TEST_REDIS_URL}, async()=>{
 const cache=require('../dist/services/cache.service');
 process.env.REDIS_URL=process.env.TEST_REDIS_URL;process.env.CACHE_NAMESPACE=`commerce-test-${crypto.randomUUID()}`;
 try {
  const url=`/api/v1/stores/${store._id}/products`;
  const first=await request(app).get(url);assert.equal(first.headers['x-cache'],'MISS');
  const second=await request(app).get(url);assert.equal(second.headers['x-cache'],'HIT');
  await Product.updateOne({_id:product._id},{$set:{name:'Updated cached product'}});
  const fresh=await request(app).get(url);assert.equal(fresh.headers['x-cache'],'MISS');assert.equal(fresh.body.data.data.find(p=>p._id===product._id).name,'Updated cached product');
  const privateRead=await request(app).get(url).set('Authorization',`Bearer ${token}`);assert.equal(privateRead.headers['x-cache'],undefined);
  const {getDB}=require('../dist/config/database'),original=getDB().execute;
  getDB().execute=()=>{throw Error('health must not query DB')};
  try {assert.equal((await request(app).get('/health')).status,200)}finally{getDB().execute=original;}
  const redis=await cache.getRedis();await redis.del(`${process.env.CACHE_NAMESPACE}:commerce:v1:catalog-generation`);
  await cache.closeRedis();process.env.REDIS_URL='redis://127.0.0.1:1';
  assert.equal((await request(app).get(url)).status,200);
 }finally{await cache.closeRedis();process.env.REDIS_URL='';}
});
test('SQL catalog relationships, full-text search and customer summaries preserve API responses',async()=>{
 const {Billboard}=require('../dist/models/billboard.model');
 const {searchProducts}=require('../dist/services/product-search.service');
 const hero=await Billboard.create({storeId:store._id,title:'Hero',imageUrl:'https://example.test/hero.jpg',isActive:true});
 await Store.updateOne({_id:store._id},{$set:{homeBillboards:[hero._id]}});
 const storefront=await request(app).get(`/api/v1/stores/slug/${store.slug}`);
 assert.equal(storefront.status,200);assert.equal(storefront.body.data.homeBillboards[0].title,'Hero');
 await Product.updateOne({_id:product._id},{$set:{name:'Running Shoe',isActive:true}});
 const matches=await searchProducts({storeId:store._id,isActive:true},'RunningShoe');assert.ok(matches.some(item=>item._id===product._id));
 const ownerToken=makeToken(await User.findOne({email:'owner@example.test'}));
 const customers=await request(app).get(`/api/v1/stores/${store._id}/customers?search=buyer`).set('Authorization',`Bearer ${ownerToken}`);
 assert.equal(customers.status,200,JSON.stringify(customers.body));assert.ok(customers.body.data.total>=1);assert.equal(typeof customers.body.data.data[0].totalSpent,'number');
 const stats=await request(app).get(`/api/v1/stores/${store._id}/stats`).set('Authorization',`Bearer ${ownerToken}`);
 assert.equal(stats.status,200,JSON.stringify(stats.body));
});
