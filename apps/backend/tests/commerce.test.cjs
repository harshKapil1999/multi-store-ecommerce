const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
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
 repl=await MongoMemoryReplSet.create({replSet:{count:1}}); await mongoose.connect(repl.getUri());
 await Promise.all([User.init(),Order.init(),Transaction.init(),Otp.init()]);
 customer=await User.create({email:'buyer@example.test',name:'Test',password:'unused',role:'customer',emailVerified:true});
 const other=await User.create({email:'other@example.test',name:'Other',password:'unused',role:'customer',emailVerified:true});
 token=makeToken(customer);otherToken=makeToken(other);
 store=await Store.create({name:'Test store',slug:'test-store',isActive:true});
 category=await Category.create({storeId:String(store._id),name:'Test',slug:'test',isActive:true});
 product=await Product.create({storeId:String(store._id),name:'Test product',slug:'test-product',description:'Actual description',featuredImage:'https://example.test/product.jpg',mrp:100,sellingPrice:100,stock:20,isActive:true,categoryId:String(category._id)});
});
after(async()=>{await mongoose.disconnect();if(repl)await repl.stop()});
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
 const foreign=await Category.create({storeId:String(new mongoose.Types.ObjectId()),name:'Foreign',slug:'foreign'});
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
