// Explicit, rerunnable release migration; writes a private backup before changing data.
const {execFileSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
const mongoose=require('node:module').createRequire(path.resolve('apps/backend/package.json'))('mongoose');
const {DEFAULT_COMMERCE_SETTINGS}=require('../packages/types/dist/index.js');
(async()=>{
 await mongoose.connect(execFileSync('gcloud',['secrets','versions','access','latest','--secret=backend-mongodb-uri','--project=project-919e6199-4ea0-4c25-bb6'],{encoding:'utf8'}).trim());
 const db=mongoose.connection.db, storeId='691c0337835c977a33a52f03';
 const nike=await db.collection('stores').findOne({_id:new mongoose.Types.ObjectId(storeId),slug:'nike-store'});if(!nike)throw Error('Nike identity mismatch');
 const removals=await db.collection('stores').find({_id:{$in:['691c070f24fb0061fd5200fa','693944c62a249e9ef3322f36'].map(id=>new mongoose.Types.ObjectId(id))}}).toArray();
 for(const s of removals){if(!['puma','adidas-store'].includes(s.slug))throw Error('Unexpected removal');for(const c of ['products','orders','transactions','categories','pages','billboards','newslettersubscribers'])if(await db.collection(c).countDocuments({storeId:String(s._id)}))throw Error('Test store is no longer empty');}
 const categories=await db.collection('categories').find({storeId}).sort({order:1}).toArray();const products=await db.collection('products').find({storeId}).sort({createdAt:-1}).toArray();const billboards=await db.collection('billboards').find({storeId}).toArray();
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'preview',deleteStores:removals.map(s=>s.slug),keepStore:nike.slug,categories:categories.length,products:products.length,ordersPreserved:await db.collection('orders').countDocuments({storeId})}));await mongoose.disconnect();return;}
 fs.mkdirSync('.local-backups',{recursive:true,mode:0o700});const backup=path.resolve('.local-backups',`release-${Date.now()}.json`);fs.writeFileSync(backup,JSON.stringify({stores:[nike,...removals],categories,products,billboards,orders:await db.collection('orders').find({storeId}).toArray()},null,2),{mode:0o600});
 const session=await mongoose.startSession();try{await session.withTransaction(async()=>{
  for(const s of removals)await db.collection('stores').deleteOne({_id:s._id,slug:s.slug},{session});
  const categoryIds=['men-shoes','men-clothing','running-shoes'].map(slug=>String(categories.find(c=>c.slug===slug)._id));
  await db.collection('stores').updateOne({_id:nike._id},{$set:{commerce:{...DEFAULT_COMMERCE_SETTINGS,supportEmail:'shop@crabtile.com'},seo:{title:'Nike collection | Crabtile',description:'Explore the Nike collection at Crabtile. Browse shoes and clothing, choose your options and track your order in your account.'},homeBillboards:['693e5f808da0f97ca3248dd8'],homeSections:[{id:'featured-categories',type:'featured_categories',title:'Shop by category',isVisible:true,order:0,categoryIds,productIds:[],limit:3,layout:'grid'},{id:'featured-products',type:'featured_products',title:'Explore the collection',isVisible:true,order:1,categoryIds:[],productIds:products.map(p=>String(p._id)),limit:8,layout:'grid'}],updatedAt:new Date()}},{session});
  for(const c of categories)if(c.description && /come under|category products/i.test(c.description))await db.collection('categories').updateOne({_id:c._id},{$set:{description:'',updatedAt:new Date()}},{session});
  for(const b of billboards){const links={'/men':'/category/men','/men-shoos':'/category/men-shoes','/women':'/products'};await db.collection('billboards').updateOne({_id:b._id},{$set:{ctaLink:links[b.ctaLink]||b.ctaLink||'/products',ctaText:'Shop collection',subtitle:'',title:b._id.toString()==='693e5f808da0f97ca3248dd8'?'Explore the Nike collection':b.title,...(b.ctaLink==='/women'?{isActive:false}:{}),updatedAt:new Date()}},{session});}
  const copied=products.find(p=>p.slug==='nike-vomero-premium');if(copied && /import|marketed/i.test(copied.description||''))await db.collection('products').updateOne({_id:copied._id},{$set:{description:'',updatedAt:new Date()}},{session});
 });}finally{await session.endSession();}
 // Convert the legacy OTP indexes after checking uniqueness. Legacy plaintext OTPs become unusable.
 const indexes=await db.collection('otps').indexes();const unique=indexes.find(i=>i.name==='email_1_type_1');if(unique&&!unique.unique)await db.collection('otps').dropIndex(unique.name);
 await db.collection('otps').createIndex({email:1,type:1},{unique:true});
 await db.command({collMod:'otps',index:{name:'expiresAt_1',expireAfterSeconds:0}});
 await db.collection('otps').deleteMany({otp:{$regex:'^[0-9]{6}$'}});
 await db.collection('orders').createIndex({checkoutKey:1},{unique:true,sparse:true});
 console.log(JSON.stringify({completed:true,deleted:removals.map(s=>s.slug),ordersPreserved:await db.collection('orders').countDocuments({storeId}),backup}));await mongoose.disconnect();
})().catch(async e=>{console.error('Migration failed:',e.message.replace(/mongodb[^ ]*/g,'[redacted]'));await mongoose.disconnect();process.exitCode=1});
