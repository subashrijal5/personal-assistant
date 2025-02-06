## Me-mini

Your personal assistant powered by Gemini

### Why I build this?
So, Firstly I wanted to learn how AI agent works. I choosed Gemeni and Google Cloud for so many reasons.
- Easy to use
- Fast and great ecosystem of google ai studio
- Easy multimodal integration
- Real time video AI, Audio Input and Many more
- Easy to scale and Customize like RAG and Data Training etc.
- Amazing Features such as inbuild Grounding(Web Search) however I am not using it right now


### What can Me-mini do?
Access your Mail, Calendar, Drive, Docs, Tasks, places and Web Search to do your daily tasks.
- Write Email
- Create Calendar Event
- Create Task
- Read Email
- Search Web
- Search Drive
- Search Docs
- Search Calendar
- Search Tasks
- Analyse Document
- Create Document
- Create Task List
- Send Email etc. etc.

### Setup Guide
- Clone the repository
- Run `npm install` to install dependencies
- Setup Google Cloud platform, enable apis related to all above mentioned services and oauth credentials
- Paste the oauth credentials in the .env file
```
#Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=create search engine in google cloud and use the id, needed for web search
NEXT_PUBLIC_APP_URL=
```
- Run `npm run dev` to start the development server
- Run `npm run build` to build the production version 

### Deployment
- It is a next js app, so you can deploy on cloud providers of your choice. 




