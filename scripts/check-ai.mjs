import {existsSync} from 'node:fs';
import {aiSettings,modelText} from '../packages/ai-engine/service.mjs';
if(existsSync('.env'))process.loadEnvFile('.env');
const config=aiSettings();
console.log(`AI provider: ${config.provider}; model: ${config.model??'unset'}`);
if(!config.configured){console.error('Not configured. Add AI_PROVIDER=gemini and GEMINI_API_KEY to your local .env.');process.exitCode=1;}
else{
 const reply=await modelText({instructions:'This is a connection test. Reply with exactly OK.',input:{check:'connection'},maxOutputTokens:256,outputLimit:1000});
 if(reply.text){console.log('AI connection successful. Restart the game server after changing .env.');}
 else{console.error(reply.reason);process.exitCode=1;}
}
