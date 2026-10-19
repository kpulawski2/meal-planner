/* Weekly routine dates and portable calendar reminders; no background timer promise. */
(function(root){
 'use strict';
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],codes=['MO','TU','WE','TH','FR','SA','SU'];
 const time=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
 function zone(value){try{new Intl.DateTimeFormat('en-GB',{timeZone:value}).format();return typeof value==='string'?value:'Europe/London';}catch{return 'Europe/London';}}
 function normalize(raw={}){const day=value=>days.includes(value)?value:null;return {
  version:1,enabled:raw?.enabled===true,id:typeof raw?.id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(raw.id)?raw.id:'',
  shopDay:day(raw?.shopDay)||'Saturday',shopTime:time(raw?.shopTime)?raw.shopTime:'09:00',
  prepDay:day(raw?.prepDay)||'Sunday',prepTime:time(raw?.prepTime)?raw.prepTime:'10:00',
  cookingStyle:['batch','fresh','mixed'].includes(raw?.cookingStyle)?raw.cookingStyle:'mixed',timeZone:zone(raw?.timeZone||'Europe/London'),
  reviewedDate:typeof raw?.reviewedDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.reviewedDate)?raw.reviewedDate:'',
  promptOnShopDay:raw?.promptOnShopDay!==false,promptedDate:typeof raw?.promptedDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.promptedDate)?raw.promptedDate:'',
  calendarRevision:typeof raw?.calendarRevision==='string'?raw.calendarRevision.slice(0,3000):''
 };}
 function parts(now=new Date(),timeZone='Europe/London'){
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone(timeZone),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',weekday:'long',hourCycle:'h23'});
  return Object.fromEntries(formatter.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 }
 function date(now,timeZone){const p=parts(now,timeZone);return `${p.year}-${p.month}-${p.day}`;}
 const wallNumber=p=>Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour||0),Number(p.minute||0),Number(p.second||0));
 function offset(now,timeZone){return Math.round((wallNumber(parts(now,timeZone))-Math.floor(now.getTime()/1000)*1000)/60000);}
 function wallToUTC(year,month,day,hour,minute,timeZone){
  const target=Date.UTC(year,month-1,day,hour,minute),candidates=[];
  const offsets=new Set([-86400000,0,86400000].map(delta=>offset(new Date(target+delta),timeZone)));
  for(const off of offsets){const value=new Date(target-off*60000);if(wallNumber(parts(value,timeZone))===target)candidates.push(value);}
  if(candidates.length)return candidates.sort((a,b)=>a-b)[0];
  // A time inside the spring clock-change gap moves forward to the first valid minute.
  for(let shift=1;shift<=180;shift++){const next=new Date(target+shift*60000),value=wallToUTCExact(next,timeZone,offsets);if(value)return value;}
  throw new Error('Choose a different reminder time.');
 }
 function wallToUTCExact(target,timeZone,offsets){for(const off of offsets){const value=new Date(target.getTime()-off*60000);if(wallNumber(parts(value,timeZone))===target.getTime())return value;}return null;}
 function next(day,clock,timeZone,now=new Date()){
  const p=parts(now,timeZone),distance=(days.indexOf(day)-days.indexOf(p.weekday)+7)%7,[hour,minute]=clock.split(':').map(Number);
  const candidate=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+distance));
  let value=wallToUTC(candidate.getUTCFullYear(),candidate.getUTCMonth()+1,candidate.getUTCDate(),hour,minute,timeZone);
  if(value<now){candidate.setUTCDate(candidate.getUTCDate()+7);value=wallToUTC(candidate.getUTCFullYear(),candidate.getUTCMonth()+1,candidate.getUTCDate(),hour,minute,timeZone);}return value;
 }
 function status(raw,now=new Date()){
  const r=normalize(raw),today=date(now,r.timeZone),p=parts(now,r.timeZone),reviewDue=r.enabled&&p.weekday===r.shopDay&&r.reviewedDate!==today;
  return {routine:r,today,reviewDue,promptDue:reviewDue&&r.promptOnShopDay&&r.promptedDate!==today&&p.hour+':'+p.minute>=r.shopTime,prepDue:r.enabled&&r.cookingStyle!=='fresh'&&p.weekday===r.prepDay,
   nextShop:next(r.shopDay,r.shopTime,r.timeZone,now).toISOString(),nextPrep:next(r.prepDay,r.prepTime,r.timeZone,now).toISOString()};
 }
 function interpret(text,current={},profile={}){
  if(typeof text!=='string'||text.length>2000)return null;
  const value=text.toLowerCase(),result=normalize(current),mealStyles={...root.MealPreferencesCore?.normalize(profile.mealStyles)},changed=[];
  if(/\b(?:don't|do not|don’t|never)\s+(?:shop|prep|batch)/.test(value))return null;
  if(/^(?:what|how|would|could|can|should|is|are)\b/.test(value)&&!/\b(?:set|save|make|build|plan|prefer|favour|favor)\b/.test(value))return null;
  const capture=(pattern,key)=>{const m=value.match(pattern);if(m){result[key]=days.find(day=>day.toLowerCase().startsWith(m[1].slice(0,3)));changed.push(key);
   const clock=value.slice(m.index+m[0].length).match(/^\s*(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
   if(clock){let hour=Number(clock[1]),minute=Number(clock[2]||0);if(clock[3]){if(hour<1||hour>12)throw new Error('Choose a valid reminder time.');hour=hour%12+(clock[3]==='pm'?12:0);}if(hour>23||minute>59)throw new Error('Choose a valid reminder time.');result[key==='shopDay'?'shopTime':'prepTime']=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');}
  }};
  const weekday='(monday|tuesday|wednesday|thursday|friday|saturday|sunday)';
  capture(new RegExp('\\b(?:shop(?:ping)?|grocer(?:y|ies)|supermarket)(?:\\s+\\w+){0,4}?\\s+'+weekday+'s?\\b'),'shopDay');
  capture(new RegExp('\\b(?:batch[ -]?cook(?:ing)?|meal[ -]?prep|prep)(?:\\s+\\w+){0,4}?\\s+'+weekday+'s?\\b'),'prepDay');
  if(/\bbatch[ -]?cook|\bmeal[ -]?prep/.test(value)){result.cookingStyle='batch';changed.push('cookingStyle');}
  if(/\bcook (?:fresh|each day|daily)|\bfresh (?:each day|daily)/.test(value)){result.cookingStyle='fresh';changed.push('cookingStyle');}
  const schedule=changed.length>0;
  if(!schedule&&!/\b(?:favour|favor|prefer|mostly|lean towards|more often)\b/.test(value))return null;
  const segments=value.split(/[.;\n]/),mealCategories=[];
  for(const segment of segments){for(const style of root.MealPreferencesCore?.styles||[]){const match=segment.match(style.pattern);if(!match)continue;
   const nearby=[...segment.matchAll(/\b(breakfast|lunch|dinner|snack)\b/g)].map(m=>({cat:m[1][0].toUpperCase()+m[1].slice(1),distance:m.index>=match.index?m.index-match.index:match.index-(m.index+m[0].length)+10})).sort((a,b)=>a.distance-b.distance);
   const cat=nearby[0]?.distance<55?nearby[0].cat:(['cereal','oats','eggs','smoothie'].includes(style.id)?'Breakfast':style.id==='burritos'||style.id==='wraps'||style.id==='salads'?'Lunch':'Dinner');
   if(mealCategories.includes(cat)||/\b(?:no|not|without|don't want|do not want)\b/.test(segment.slice(Math.max(0,match.index-18),match.index)))continue;
   mealStyles[cat]={style:style.id,strength:/\b(?:sometimes|mix|occasionally)\b/.test(segment)?'prefer':'mostly'};mealCategories.push(cat);changed.push('mealStyles');
  }}
  if(!changed.length)return null;if(schedule)result.enabled=true;return {routine:result,mealStyles,mealCategories,changed:[...new Set(changed)]};
 }
 function revision(raw,profile={}){const r=normalize(raw);return JSON.stringify([r.shopDay,r.shopTime,r.prepDay,r.prepTime,r.cookingStyle,r.timeZone,root.MealPreferencesCore?.normalize(profile.mealStyles)]);}
 const pad=n=>String(n).padStart(2,'0');
 const stamp=now=>now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 function localStamp(now,timeZone){const p=parts(now,timeZone);return p.year+p.month+p.day+'T'+p.hour+p.minute+p.second;}
 const escape=value=>String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 const utcOffset=n=>(n>=0?'+':'-')+pad(Math.floor(Math.abs(n)/60))+pad(Math.abs(n)%60);
 function timezoneLines(timeZone,now){
  const year=Number(parts(now,timeZone).year),start=Date.UTC(year-1,0,1),end=Date.UTC(year+2,0,1),lines=['BEGIN:VTIMEZONE','TZID:'+timeZone];
  let previous=offset(new Date(start),timeZone);lines.push('BEGIN:STANDARD','DTSTART:'+(year-1)+'0101T000000','TZOFFSETFROM:'+utcOffset(previous),'TZOFFSETTO:'+utcOffset(previous),'END:STANDARD');
  for(let instant=start+86400000;instant<=end;instant+=86400000){const current=offset(new Date(instant),timeZone);if(current===previous)continue;
   let left=instant-86400000,right=instant;while(right-left>60000){const mid=Math.floor((left+right)/120000)*60000;if(offset(new Date(mid),timeZone)===previous)left=mid;else right=mid;}
   const wall=new Date(right+previous*60000),kind=current>previous?'DAYLIGHT':'STANDARD';lines.push('BEGIN:'+kind,'DTSTART:'+stamp(wall).replace(/Z$/,''),'TZOFFSETFROM:'+utcOffset(previous),'TZOFFSETTO:'+utcOffset(current),'END:'+kind);previous=current;
  }return [...lines,'END:VTIMEZONE'];
 }
 function calendar(raw,profile={},now=new Date(),appUrl='https://meal-planner-wm4j.onrender.com/'){
  const r=normalize(raw);if(!r.enabled||!r.id)throw new Error('Save your weekly routine before adding reminders.');
  const target=new URL(appUrl);if(target.protocol!=='https:'&&target.hostname!=='localhost'&&target.hostname!=='127.0.0.1')throw new Error('Use a secure app link.');target.hash='weekly-routine';
  const choices=root.MealPreferencesCore?.describe(profile).map(row=>row.category+': '+row.label.toLowerCase()).join('; ')||'Choose the meal styles you want this week';
  const events=[{type:'shopping',day:r.shopDay,time:r.shopTime,title:'Choose meals before your shop',body:'Choose next week’s meal styles, fit your budget and check the shopping list. '+choices+'. Open Meal Planner: '+target.href}];
  if(r.cookingStyle!=='fresh')events.push({type:'prep',day:r.prepDay,time:r.prepTime,title:'Your weekly meal prep',body:'Open your saved plan and prep centre. Batch cook the meals you selected; follow each recipe’s storage instructions. '+choices+'. Open Meal Planner: '+target.href});
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Meal Planner//Weekly Routine//EN','CALSCALE:GREGORIAN',...timezoneLines(r.timeZone,now)];
  for(const e of events){const first=next(e.day,e.time,r.timeZone,now);lines.push('BEGIN:VEVENT','UID:'+r.id+'-'+e.type+'@meal-planner','DTSTAMP:'+stamp(now),'DTSTART;TZID='+r.timeZone+':'+localStamp(first,r.timeZone),'DURATION:PT15M','RRULE:FREQ=WEEKLY;COUNT=52;BYDAY='+codes[days.indexOf(e.day)],'SUMMARY:'+escape(e.title),'DESCRIPTION:'+escape(e.body),'URL:'+target.href,'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:'+escape(e.title),'END:VALARM','END:VEVENT');}
  lines.push('END:VCALENDAR');
  // RFC 5545 lines fold at 75 UTF-8 octets, without splitting a code point.
  return lines.map(line=>{let result='',length=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(length+bytes>75){result+='\r\n ';length=1;}result+=char;length+=bytes;}return result;}).join('\r\n')+'\r\n';
 }
 root.WeeklyRoutineCore=Object.freeze({days,normalize,parts,date,next,status,interpret,revision,calendar,zone});
})(globalThis);
