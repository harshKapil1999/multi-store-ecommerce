const path=require('node:path');const {createRequire}=require('node:module');const r=createRequire(path.resolve('apps/backend/package.json'));
r('dotenv').config({path:'apps/backend/.env'});
const {getDB,disconnectDB}=require('../apps/backend/dist/config/database');const {sql}=r('drizzle-orm');
(async()=>{const result=await getDB().execute(sql`select (select count(*) from store) as stores, (select count(*) from product) as products, (select count(*) from "order") as orders, (select count(*) from transaction) as transactions, (select count(*) from shipment where state = 'needs_review') as shipping_review`);console.log(result.rows[0]);})().catch(e=>{console.error('Inspection failed:',e.code||e.name);process.exitCode=1}).finally(disconnectDB);
