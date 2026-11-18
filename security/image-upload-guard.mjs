// File-content allowlist for member images. Detects supported containers and bounds dimensions.
// Not a complete image decoder or malware scanner. Do not trust client-reported MIME or dimensions.
export function inspectMemberImage(bytes, mime){
 const n=bytes?.length||0;
 if(!(bytes instanceof Uint8Array)||n<20)return null;
 const d=new DataView(bytes.buffer,bytes.byteOffset,n);
 const text=(at,len)=>String.fromCharCode(...bytes.subarray(at,at+len));
 const result=(width,height)=>Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&width<=12000&&height<=12000&&width*height<=60000000?{width,height,mime}:null;
 if(mime==='image/png'){
  if(text(0,8)!=='\x89PNG\r\n\x1a\n'||n<45||d.getUint32(8)!==13||text(12,4)!=='IHDR')return null;
  let p=8,idat=false,end=false;
  while(p+12<=n){
   const len=d.getUint32(p),kind=text(p+4,4);
   if(len>n-p-12||!/^[A-Za-z]{4}$/.test(kind))return null;
   if(kind==='IDAT')idat=true;
   if(kind==='IEND'){end=len===0&&p+12===n;break;}
   if(kind==='IHDR'&&p!==8)return null;
   p+=12+len;
  }
  if(!idat||!end)return null;
  return result(d.getUint32(16),d.getUint32(20));
 }
 if(mime==='image/jpeg'){
  if(bytes[0]!==255||bytes[1]!==216||bytes[n-2]!==255||bytes[n-1]!==217)return null;
  let p=2,width=0,height=0;
  const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while(p+4<n){
   if(bytes[p++]!==255)return null;
   while(p<n&&bytes[p]===255)p++;
   if(p>=n)return null;
   const marker=bytes[p++];
   if(marker===0xd9||marker===0xd8||marker===0||marker===1||(marker>=0xd0&&marker<=0xd7))return null;
   if(p+2>n)return null;
   const len=d.getUint16(p);
   if(len<2||p+len>n-2)return null;
   if(sof.has(marker)){
    if(len<8)return null;
    height=d.getUint16(p+3);width=d.getUint16(p+5);
   }
   if(marker===0xda)return result(width,height);
   p+=len;
  }
  return null;
 }
 if(mime==='image/webp'){
  if(text(0,4)!=='RIFF'||text(8,4)!=='WEBP'||d.getUint32(4,true)+8!==n)return null;
  let p=12,width=0,height=0,frame=false;
  while(p+8<=n){
   const kind=text(p,4),size=d.getUint32(p+4,true),at=p+8,next=at+size+(size&1);
   if(next>n)return null;
   if(kind==='VP8X'){
    if(p!==12||size!==10||(bytes[at]&2))return null; // animated WebP is not accepted by this photo policy
    width=1+bytes[at+4]+256*bytes[at+5]+65536*bytes[at+6];
    height=1+bytes[at+7]+256*bytes[at+8]+65536*bytes[at+9];
   }else if(kind==='VP8 '){
    if(size<10||(bytes[at]&1)||bytes[at+3]!==157||bytes[at+4]!==1||bytes[at+5]!==42||frame)return null;
    const w=d.getUint16(at+6,true)&0x3fff,h=d.getUint16(at+8,true)&0x3fff;
    if((width&&width!==w)||(height&&height!==h))return null;
    width=w;height=h;frame=true;
   }else if(kind==='VP8L'){
    if(size<5||bytes[at]!==47||frame)return null;
    const v=d.getUint32(at+1,true),w=(v&0x3fff)+1,h=((v>>>14)&0x3fff)+1;
    if((v>>>29)!==0||(width&&width!==w)||(height&&height!==h))return null;
    width=w;height=h;frame=true;
   }else if(kind==='ANIM'||kind==='ANMF')return null;
   p=next;
  }
  return p===n&&frame?result(width,height):null;
 }
 return null;
}
