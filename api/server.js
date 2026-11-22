// Standalone Kempenfelt service issue intake API. No Business Hub dependencies.
const express = require("express");
const {google} = require("googleapis");
const crypto = require("node:crypto");
const app = express();
app.disable("x-powered-by");
app.use(express.json({limit:"32kb"}));
const SHEET_ID = "1x7CJaqFkMLOB4i5pdkY34N8OasFZ90hRX27m3k4I-kg";
const COLUMNS = ["repName","custName","custPhone","custEmail","orderNo","product","location","category","details","photos","siteNotes","promised","visit"];
const allowedOrigin = process.env.PUBLIC_FORM_ORIGIN || "https://kempenfelt-service-issues.onrender.com";
app.use((req,res,next)=>{res.set("Cache-Control","no-store");res.set("Vary","Origin");if(req.headers.origin===allowedOrigin){res.set("Access-Control-Allow-Origin",allowedOrigin);res.set("Access-Control-Allow-Headers","Content-Type");res.set("Access-Control-Allow-Methods","POST, OPTIONS");}if(req.method==="OPTIONS")return res.sendStatus(req.headers.origin===allowedOrigin?204:403);next();});
app.get("/health",(req,res)=>res.json({ok:true,configured:!!process.env.GOOGLE_SERVICE_ACCOUNT_JSON}));
app.post("/api/issues",async(req,res)=>{
 if(req.headers.origin!==allowedOrigin)return res.status(403).json({ok:false,error:"Origin not allowed"});
 if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)return res.status(503).json({ok:false,error:"Service not configured"});
 const data=req.body||{};
 if(!COLUMNS.every(k=>typeof data[k]==="string"&&data[k].length<=5000)||!data.repName.trim()||!data.custName.trim()||!data.details.trim())return res.status(400).json({ok:false,error:"Invalid report"});
 const id=crypto.randomUUID();
 const values=[new Date().toISOString(),...COLUMNS.map(k=>data[k]),"FALSE","","","","",id];
 try{
  const credentials=JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth=new google.auth.GoogleAuth({credentials,scopes:["https://www.googleapis.com/auth/spreadsheets"]});
  const sheets=google.sheets({version:"v4",auth});
  const result=await sheets.spreadsheets.values.append({spreadsheetId:SHEET_ID,range:"'Form Responses 1'!A:S",valueInputOption:"RAW",insertDataOption:"INSERT_ROWS",requestBody:{values:[values]}});
  const updatedRange=result.data.updates?.updatedRange;
  if(!updatedRange)throw new Error("No updated range returned");
  // Read back the unique ID to ensure the append was recorded.
  const match=updatedRange.match(/![A-Z]+(\\d+):/);
  if(!match)throw new Error("Unable to verify appended row");
  const row=match[1];
  const check=await sheets.spreadsheets.values.get({spreadsheetId:SHEET_ID,range:"'Form Responses 1'!S"+row});
  if(check.data.values?.[0]?.[0]!==id)throw new Error("Report verification failed");
  return res.status(201).json({ok:true,reportId:id});
 }catch(err){console.error("Report save failed",err.message);return res.status(502).json({ok:false,error:"Unable to confirm save; contact office before retrying to avoid duplicates"});}
});
app.listen(process.env.PORT||3000,()=>console.log("Service issue intake API ready"));
