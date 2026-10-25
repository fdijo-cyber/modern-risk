// Offline HTTP test transport. Never loaded by the application in production.
const original=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
  const body=JSON.parse(options.body),input=JSON.parse(body.contents[0].parts[0].text);
  if(input.directive)return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({kind:'directive',analysis:'Fund the requested refinery at the named site.',objectives:[{id:'refinery',title:'Western United States refinery',order:{action:'build',target:6,building:'refinery'}}]})}]}}]}),{status:200});
  return new Response(JSON.stringify({candidates:[]}),{status:200});
 }
 return original(url,options);
};
