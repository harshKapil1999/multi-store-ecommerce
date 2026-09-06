// Read-only catalog review. Credentials remain in memory.
const {execFileSync}=require('node:child_process');
const {createRequire}=require('node:module');
const mongoose=createRequire(require('node:path').resolve('apps/backend/package.json'))('mongoose');
(async()=>{await mongoose.connect(execFileSync('gcloud',['secrets','versions','access','latest','--secret=backend-mongodb-uri','--project=project-919e6199-4ea0-4c25-bb6'],{encoding:'utf8'}).trim());const db=mongoose.connection.db;
for(const name of ['categories','billboards'])console.log(name,JSON.stringify(await db.collection(name).find({storeId:'691c0337835c977a33a52f03'}).toArray()));
console.log('Store content',JSON.stringify(await db.collection('stores').findOne({slug:'nike-store'},{projection:{topBar:1,footer:1,navigation:1,homeSections:1,homeBillboards:1,description:1}})));
console.log('OTP indexes',await db.collection('otps').indexes());
await mongoose.disconnect();})().catch(e=>{console.error(e.name);process.exitCode=1});
