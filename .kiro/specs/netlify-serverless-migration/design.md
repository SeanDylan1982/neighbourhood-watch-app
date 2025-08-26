# Design Document

## Overview

This design addresses the migration from Railway to Netlify Functions due to the end of the Railway trial period. The solution involves converting the existing Express.js monolithic server into individual serverless functions that can run on Netlify's platform. This migration maintains all existing functionality while adapting to a serverless, stateless architecture.

## Architecture

The migration involves transforming the current monolithic Express.js server into a collection of serverless functions:

### Current Architecture (Railway)
- Single Express.js server with multiple route handlers
- Persistent database connections
- Socket.IO for real-time features
- Shared middleware and services
- Stateful server with in-memory caching

### Target Architecture (Netlify Functions)
- Individual serverless functions for each API endpoint
- Connection pooling for database access
- WebSocket alternatives for real-time features
- Shared utilities and middleware as modules
- Stateless functions with external state management

## Components and Interfaces

### 1. Function Structure

**Location**: `netlify/functions/`

Each API endpoint will be converted to a separate function:

```
netlify/functions/
├── auth-login.js          # POST /api/auth/login
├── auth-register.js       # POST /api/auth/register
├── auth-refresh.js        # POST /api/auth/refresh
├── users-profile.js       # GET/PUT /api/users/profile
├── users-me.js           # GET /api/users/me
├── chat-messages.js       # GET/POST /api/chat/messages
├── chat-groups.js         # GET/POST /api/chat/groups
├── notices.js            # GET/POST/PUT/DELETE /api/notices
├── reports.js            # GET/POST/PUT/DELETE /api/reports
├── upload.js             # POST /api/upload
├── health.js             # GET /api/health
└── ...
```

### 2. Shared Utilities

**Location**: `netlify/functions/shared/`

Common functionality will be extracted into shared modules:

```javascript
// netlify/functions/shared/database.js
const mongoose = require('mongoose');

let cachedConnecatabase = async () => {
  if (cachedConnection) {
const connectToDatabase = async () => {
  if (cachedConnusher.s {
    return cachedConnection;
  }
ubscrimChat(channebe(Id}`);
k); connection = awaitconnect(processv.MONGODB_URI, {
    m10,
    serverS
    socketTimeoutMS  rel)expor
    this.pusher.bscribe(channel.nat default ealtimeService();
```
achedConon = connection;
 urn connec
};

module.es = { connectToDataba
ror

### 3. Authenticati Handlingware

**Locationnetlify/functiared/aut`

Jontext.funcWT autwiltl beerror:`, { handledid utility:
onNerror.message,
 cripttack,
  ('jsonestId: cRequestId,
    timesp: new Date().tng(),
  
  
  // Determinokeepropriate status codess.n = (tokenenv.JWT
conry {tatusCode = 500th (error) {
    t message = 'Internhrow n.vererror';
  
  if (eifyr.name === 'nvalid ionError') token');
    statusCod st au0;
    messagetonerror.messagtext.webto
TokenFse if (error.name};romH=nauthorizedEr (h=> {rization;
 authuatusCode = rn ;
    message = authHehorized';adeHeader = header.startsWiad) 
    ? autif (error.name === 'Forh;Error') {
};tusCode = 403;
    mesorbidden';
  }
 
Headesrn {
    statusubse,
    htring(7) rsHeader
    :rty: JSON.stringify({ ers =: message }), { authateToken, extractTokeaders };
```ors.js`
an
```

### Datdlede Connecti coError Handling
nsiacross all functions:
 'Arol-ccripts': 'Contentype, AuthX-Requested-With, Apt, Origin',
 ccess-Control-low-M: 'GET, POST, PUTLETE, PATCH, OPTIONS',
  'Access-Controlllow-Creds': 'true',
c;

const onsess-ors = (evCont => {
  rAithRett.httpMethodry =l'OPTIONS') {
   low-ol
    try {00 *ode: 200,
     (i + 1)): corsHeaders,
      b);',
    };

  return n
};

module.ex corsHeaders, hars };
```

ls

###hannction Request/Redler e Format

p = ex``cript
app.use(exent press.jsonStructu
// Netl`ja} =press rh-login');e
  httpMethod: 'GET' | pp.po' | 'PUst('/c (rETE' | 'PAe => {'OPTIONS',
  path: '/api/enint',
  heade{
    'authorizatiearer 
  c 'content-type': 'apponsq, rent on',
= { // ...
  },
  bo',ify(req.boring or null',dy),
ode).ryStringParametejs: {
    // quon(JSON.pa
  }
}
ing on http://loca:8888');
});ucture
{
: 200 | 400 | 401  | 500,
s: {
    'Conteapplicaon/json',
 'Access-Coigin': '*',
    /
### Function   statg
ts/ody: 'JSON strauth-login.teuire('../../netctions/auth-login');
h
```tials', async 
onst
      httpMethod: 'P##T',
      he# D-l: { ogintent-type':ne Cplication/json' }onnection Manag function', () => {
 ould body: JSON.stringiauthenticate valid
  ```javascrl: 'test@examplidescfiguration
c       paonstrd: 'pass dbConfi
      }),
    g 
  maxPoolze: 10,
/   const resulonst erSt handlerelectionTimeoutMS: 5{ection pooling c handler }/ tests/func
```jaketse,
    expect(result.st busCode).toBe(200);ufferMaxTitries: 0,
};const body = JSON.parse(rt.body);
```meopect(body.utMS: 45000,efined();
  })vas
axIdle0,
```

## Dep  bufnt Configuration

ro# Netr fy Configuration

```Hamlndling
fy.toml
[build]
  functions ###netlify/fu Ftions"
  publish = unction-Level"

[build.environ Erro
  NODE_VERSr Hand"18"

[[redir detai
      }),
  to = "/.ney/functiosplat"
  status = 200
    from = ls: error.ectsliferCom
//ions]
  nler = "esbuild"

Counctions."*de:rs: corsHe 401, aders,   return {
     eout = 30
        errornauthorized',
      sage: error.mess
```   }),
    };
  }ard:

```urn {
    statusCode+srv:,
    header=your-jwt-ss: corsHea//: ...
JWT_REFRESH_SECRET=yourbody: JSON.sret
PUSHERtringiD=your-pusher-appfy(
PUSHER_KEY=yr error',{SEey
PUSHER_SECR=your-pusherecret
PUSTER=yer-cluster
NODtion
```
    }),
   Client-};e Changes

### APIigur

```j*Network Graceful degradatiowith canses where poble

##Time Featration

### Currer-nSocket.Ietlifyementati-sitepp";.net
  }
  e current real-timeatures use Soc.IO, res tent connectionify, we neives:

### Op: Netlify Functiling

// cliescript
// netlintlfunctions/chat-poll.jsopment: Use Netlif/src/aor local functions
vafig/s.handler = asyncrn procesa> {
  const { lastMespi.jspro = JSON.pducAPP_APt.body);
  
ion/ Poll for new me") {ttp:ince l//localhoeId
  stnst newMessages = a:8888ssagesSince(lastMesd);

ApiUrurn {
    statusCodl ;()
    headers: corsHead
dy: JSON.striify({ messs: newMessages })
export n nst API_BASE_URL =e
ri
```

### ptn 2: Third-Party ervice

// clisPushith services like Pusher or Ably foer eal-time featService 

```javascript
    })lify/functions/sha;/realtime.js
Pusher = requirer');

cor = ne
  appId: proce  .env.PUSHER_AP{lba,
  key: procesck)nv.PUSHER {EY,
  secretchatId}ss.env`);ET,
  }luster: p.PUSHER_CLUSTER,
}
  h(`${API_BASEchat/sage`, {
      broadcastMmesage = async (th event, data) => {
  await pus      'Auth(channel, eorizatdata);
ion': `  he'Co${getToken()}`,
  nten},
 odule.exports =    }oadcastMessage };);

}
 ## Option 3: S `r-Sent EvE)

For one-wtime :

```jat
// netlify/fus/chaents.js
exporter = async) => {
  retu {
    statusCo
   ement fu: {te limiting
orsHeaders,
    aseType': 'tex Syream',
     -Controe',
      'Connectep-alive',
    },
    body{JSON.stringify(e: 'hear })}\n\n`
iptt
};
```
urn mong.connection;
## Fileabase.jsndling
 
  return mongoose.connect(process.eDB_URI, {
  ommands: fal
#   maxPoolSiz## Current  Implementatiulter for filonor Netlify Function
   serverSelectimeoutMS: 5000,
### socketTimeouOptio45000,
    // Secun 1: Directs
    ssl: consc
    sslValidate: truut co Cloud Storage
 });
};

exports.handler ```ync (event) => {
rmance Confile, fileName }sideonsse(event.bod

##const uploadParams =#old Stzation
t: proceET,
    Key:,
    Body: Buffom(file, 'base64'),
    Contenge/jpeg', //rom file
  
```ipt
//const result =  Mi connectioad(uploadParaon =promise() nul
    if (!conimizeon) {e('mongoose');
  return {{
      tusCod e: 200,,
    corsHea     maxPdeool
    body: J   });ingify({ url: result.Location }),
 
    }
 b`

### Option uffNetlify Forms erCom connectim
       conneawait mongoose.(process.env.MONGODB_U
   lingy's built-in file uploing for simpler

## Clieonfiguration Updates

## API Configura

**Locatient/src/config/js`

`
const NETLIFY_FUNCL = "https://yo-site.neetlify/funct
const LOC= "http://local8/.netlify/ftions";

const getrl = () => {
  i(process.env.NOV === "produ{
  TLIFY_FUNCTIOL;
  
  
  return proces```jatuEACT_APP_e,URL || LOCAL_FUNC
};

exporonst API_BASE_URL Url();

// Uoint paths Netlify Func
  port default {
  ENplatformod
    AUTH: {
   e',GIN: "/au
      REGIS-register", 
 REFRESH: "/auth-re
    },
  targeode1{
      PROFI8',"/users-profile",
    sers-me",
    },
   
      outfileS: "/chat-mesfunction.js
      GROUPS: ``oups",
    },
// ...
  },
};
```

unc##eal-Time Clientnticates

If ion M funonrd-party serske Pu

```javascript
// - ient/src/serviHealRealtimeServith js
import Pusherccrom 'pushetions n
ration witsher
zaass RealtimeServtion
- Pe:structor() {
    t event.her = new hrsher(process.efr esuCT_APP_PUSHERlt.statusCmoninstartTime,
      cluster: progttpMEACT_APP_PUSHECLUSTER,
   
};
  
  subscribeToChannName, ev {
    con= this.pusher.sbe(cha);
    channebind(eventNallback);
    rhannel;
  }
}

```ort defaulltimeService(
```

#ting Strategy

#l Development

que Netlify CLI for estrror Tction testing:
rackingId: contexetawsRequeshod,

# InstaNetlify CLI
npm il -g netlif
Integrc  on with error track parationing.
# Run functions    },
 etlify dev

#    jsandividual functi: {t.awsRequestId,
 y functions:invokeoad '{ethod"body":\"email\":\"test@example.com\",\"password\":\"password\"}"}'
```

### Function Testing

Create test files for each function:

```javascript
// tests/functions/auth-login.test.js
const { handler } = require('../../netlify/functions/auth-login');

describe('auth-login function', () => {
  test('should authenticate valid user', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'validpassword'
      }),
      headers: {}
    };
    
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('token');
  });
});
```

### Integration Testing

Test the complete flow from client to functions:

```javascript
// tests/integration/auth.test.js
const axios = require('axios');

describe('Authentication Integration', () => {
  test('should complete login flow', async () => {
    const response = await axios.post(
      'http://localhost:8888/.netlify/functions/auth-login',
      {
        email: 'test@example.com',
        password: 'password'
      }
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
  });
});
```

## Deployment Configuration

### Netlify Configuration

**Location**: `netlify.toml`

```toml
[build]
  functions = "netlify/functions"
  publish = "client/build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"

[dev]
  functions = "netlify/functions"
  publish = "client/build"
  command = "npm run dev"
  port = 3000
  functionsPort = 8888
```

### Environment Variables

Required environment variables for Netlify:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET=your_s3_bucket
```

## Performance Considerations

### Cold Start Optimization

1. **Minimize Dependencies**: Only import required modules in each function
2. **Connection Reuse**: Cache database connections between invocations
3. **Bundle Optimization**: Use esbuild for faster function bundling

### Function Size Limits

Netlify Functions have a 50MB limit. Strategies:

1. **Code Splitting**: Separate large dependencies into shared modules
2. **External Services**: Move heavy operations to external services
3. **Lazy Loading**: Load dependencies only when needed

### Database Connection Management

```javascript
// Implement connection pooling with timeout
const connectWithTimeout = async (timeoutMs = 5000) => {
  return Promise.race([
    connectToDatabase(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
    )
  ]);
};
```

## Security Considerations

### Function-Level Security

1. **Input Validation**: Validate all inputs in each function
2. **Rate Limiting**: Implement per-function rate limiting
3. **CORS Configuration**: Restrict origins in production
4. **Environment Variables**: Secure storage of sensitive data

### Authentication Flow

```javascript
// Secure token validation
const validateRequest = async (event) => {
  const token = extractTokenFromHeaders(event.headers);
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  const decoded = authenticateToken(token);
  
  // Additional validation
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return decoded;
};
```

## Migration Strategy

### Phase 1: Core Functions
- Authentication functions (login, register, refresh)
- User profile functions
- Health check function

### Phase 2: Main Features
- Chat functions
- Notice board functions
- Report functions

### Phase 3: Advanced Features
- File upload functions
- Admin functions
- Real-time features

### Phase 4: Optimization
- Performance tuning
- Error handling improvements
- Monitoring and logging

This design provides a comprehensive approach to migrating from Railway to Netlify Functions while maintaining all existing functionality and improving scalability through serverless architecture.
}; to Netlify Funhile maintaining ating functionality and ioving scalability tough serverss architecture.
