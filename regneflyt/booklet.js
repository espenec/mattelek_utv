(function(root){
const names={add:'Addisjon',sub:'Subtraksjon',mul:'Multiplikasjon',div:'Divisjon'};
const ranges=['0–10','10–30','30–100'];
function pool(op,level){const p=[];if(op==='add'||op==='sub'){const [lo,hi]=[[0,10],[10,30],[30,100]][level];for(let a=lo;a<=hi;a++)for(let b=lo;b<=hi;b++){if(op==='add'&&a+b<=hi)p.push([a,b,a+b]);if(op==='sub'&&a>=b)p.push([a,b,a-b]);}}else{const [lo,hi]=[[1,5],[6,10],[1,10]][level];for(let a=lo;a<=hi;a++)for(let b=1;b<=10;b++)p.push(op==='mul'?[a,b,a*b]:[a*b,a,b]);}return p;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sheets(op,level){const p=pool(op,level),out=[];for(let s=0;s<5;s++){let row=[];while(row.length<60)row.push(...shuffle(p.slice()));row=row.slice(0,60);if(out.some(x=>JSON.stringify(x)===JSON.stringify(row))){s--;continue;}out.push(row);}return out;}
function label(op,level){return names[op]+' · '+((op==='add'||op==='sub')?ranges[level]:['1–5-gangen','6–10-gangen','1–10-gangen'][level]);}
function pdf(op,level,works=sheets(op,level)){
 const pages=[];let c='';const n=v=>Number(v.toFixed(2));
 const esc=s=>String(s).replace(/–/g,'-').replace(/[^\x20-\xff]/g,'').replace(/([\\()])/g,'\\$1');
 const text=(s,x,y,size=11,bold=false)=>{c+=`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${n(842-y)} Tm (${esc(s)}) Tj ET\n`;};
 const line=(x,y,xx,yy,w=.5,gray=.65)=>{c+=`${gray} G ${w} w ${x} ${n(842-y)} m ${xx} ${n(842-yy)} l S 0 G\n`;};
 const box=(x,y,w,h)=>{line(x,y,x+w,y);line(x,y+h,x+w,y+h);line(x,y,x,y+h);line(x+w,y,x+w,y+h);};
 const header=(title,page)=>{text('REGNEFLYT / 4 MINUTTER',42,39,9,true);text(title,42,78,24,true);text(label(op,level),42,102,11);line(42,119,553,119);text('Navn:',42,145);line(76,148,340,148);text('Klasse:',365,145);line(405,148,553,148);text('Regneflyt',42,807,9);text(`${page} / 6`,525,807,9);};
 header('Min framgang',1);text('Fem forsøk. Fire minutter hver gang.',42,181,14,true);
 text('1. Arbeid med ett oppgaveark i 4 minutter. Stopp når tiden er ute.',42,204);
 text('2. Rett arket, og skriv dato og antall rette i tabellen.',42,223);
 text('3. Sett et punkt i grafen. Trekk en linje mellom punktene dine.',42,242);
 const ys=266,rh=29;box(42,ys,511,rh*6);for(let r=1;r<6;r++)line(42,ys+r*rh,553,ys+r*rh);line(152,ys,152,ys+rh*6);line(353,ys,353,ys+rh*6);
 text('Oppgaveark',54,ys+19,11,true);text('Dato',165,ys+19,11,true);text('Antall rette (0-60)',367,ys+19,11,true);
 for(let i=1;i<=5;i++)text('Ark '+i,54,ys+19+i*rh);
 text('Se framgangen din',42,479,16,true);text('Antall rette',42,501,10);
 const gx=83,gy=732,gw=438,gh=210;
 for(let v=0;v<=60;v++){const y=gy-v*gh/60;line(gx,y,gx+gw,y,v%10===0?.65:.25,v%10===0?.55:.86);if(v%10===0)text(v,gx-25,y+3,9);}
 for(let i=0;i<5;i++){let x=gx+i*gw/4;line(x,gy-gh,x,gy,.65,.6);text(i+1,x-3,gy+17,10);}
 text('Forsøk / oppgaveark',235,771,10);pages.push(c);c='';
 for(let s=0;s<5;s++){header('Oppgaveark '+(s+1),s+2);text('Dato:',42,176);line(74,179,230,179);text('Tid: 4 minutter',365,176,12,true);text('Regn ovenfra og ned i hver kolonne. Gjør så mange du klarer.',42,204,10);
 const symbols={add:'+',sub:'-',mul:'×',div:':'};
 works[s].forEach(([a,b],i)=>{let col=Math.floor(i/20),r=i%20,x=42+col*174,y=239+r*26; text((i+1)+'.',x,y,8);text(`${a} ${symbols[op]} ${b} =`,x+22,y,14);line(x+111,y+3,x+156,y+3,.6,.35);});
 text('Antall rette: ______ / 60',42,785,11,true);text('Før resultatet inn på side 1.',320,785,10);pages.push(c);c='';}
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];const kids=[];
 if(root.PdfFonts)root.PdfFonts.forEach((font,i)=>{const stream=typeof atob==='function'?atob(font.data):Buffer.from(font.data,'base64').toString('latin1');const desc=objects.length+1, file=desc+1;objects[i+2]=`<< /Type /Font /Subtype /TrueType /BaseFont /DejaVuSans${i?'-Bold':''} /FirstChar 32 /LastChar 255 /Widths [${font.widths.join(' ')}] /Encoding /WinAnsiEncoding /FontDescriptor ${desc} 0 R >>`;objects.push(`<< /Type /FontDescriptor /FontName /DejaVuSans${i?'-Bold':''} /Flags 32 /FontBBox [-1021 -463 1793 1232] /ItalicAngle 0 /Ascent 928 /Descent -236 /CapHeight 729 /StemV 80 /FontFile2 ${file} 0 R >>`);objects.push(`<< /Length ${stream.length} /Length1 ${stream.length} >>\nstream\n${stream}\nendstream`);});
 pages.forEach(stream=>{const id=objects.length+1;kids.push(id+' 0 R');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count 6 >>`;
 let output='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(output.length);output+=`${i+1} 0 obj\n${o}\nendobj\n`;});const start=output.length;output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;offsets.slice(1).forEach(o=>output+=String(o).padStart(10,'0')+' 00000 n \n');output+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return Uint8Array.from(output,ch=>ch.charCodeAt(0));
}
root.Regneflyt={pool,sheets,pdf,label,names};if(typeof module!=='undefined')module.exports=root.Regneflyt;
})(globalThis);
