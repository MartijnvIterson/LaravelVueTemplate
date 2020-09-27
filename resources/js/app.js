import Vue from 'vue'
import VueRouter from 'vue-router'
import { routes } from './routes';
import { store } from './store/store';
Vue.config.productionTip = false;
const socket = io('https://node.webzey.net');


fetch("/api/getUserValidationToken", {
    method: 'GET', 
    mode: 'cors',
    cache: 'no-cache', 
    headers: {
    'Content-Type': 'application/json'
    }
}).then((resp) => resp.json()).then((data) => {
    socket.emit('userConnect', { 
        data
    });
}).catch((e) => {
    console.log("Webzey: A error occured while loading the userValidationToken! (c)")
})  




//regular expressions to extract IP and country values
var countryCodeExpression = /loc=([\w]{2})/;
var userIPExpression = /ip=([\w\.]+)/;
var countryCode = null;
var ip = null;
var userIP = null;
var userCountry = null;
var currentRoute = null;


function getDate() {
    return new Date();
}


// document.getElementById("webzey-analytics").onmousemove = function(event) {myFunction(event)};

// function myFunction(e) {
// 	console.log(e);
// }


//automatic country determination.
function initCountry() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 3000;
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    countryCode = countryCodeExpression.exec(this.responseText)
                    ip = userIPExpression.exec(this.responseText)
                    if (countryCode === null || countryCode[1] === '' ||
                        ip === null || ip[1] === '') {
                        reject('IP/Country code detection failed');
                    }
                    let result = {
                        "countryCode": countryCode[1],
                        "IP": ip[1]
                    };
                    resolve(result)
                } else {
                    reject(xhr.status)
                }
            }
        }
        xhr.ontimeout = function () {
            reject('timeout')
        }
        xhr.open('GET', 'https://www.cloudflare.com/cdn-cgi/trace', true);
        xhr.send();
    });
}

initCountry().then(result => { 
    userIP = result.IP; 
    userCountry = result.countryCode;
    socket.emit('pageSwitch', { data: {
        ip: userIP,
        country: userCountry,
        nextPageName: currentRoute.name,
        nextPagePath: currentRoute.path,
        send_at: getDate(),
    } });
}).catch(e => console.log(e))



/*
    In this file the main settings for the Vue App are set.
    Also the vue-router and vuex are imported.
 */

Vue.use(VueRouter);

/*
    The routes are set in the routes.js file.
    Components are loaded in the routes.js file and send to the server.
 */

const router = new VueRouter({
    mode: 'history',
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
          return savedPosition;
        } else {
          return { x: 0, y: 0 };
        }
      }
});

/*
    BeforeEnter
    1. Log page visits.
    2. GET userDetails form the user.
    3. Generate data to send to the server.
    4. Send the data to the server.
 */

// Functional Event Bus
import { EventBus } from './event-bus.js';

router.beforeEach((to, from, next) => {
    currentRoute = to;
    EventBus.$emit('page-switch');
    socket.emit('pageSwitch', { data: {
        ip: userIP,
        country: userCountry,
        nextPageName: to.name,
        nextPagePath: to.path,
        send_at: getDate(),
    } });
    if(to.matched.some(record => record.meta.requiresAuth)) {
        
        
        // Check if 2FA is required
        if(to.matched.some(record => record.meta.requires2FA)) {
            checkAuthentication(to.meta.permission, function(data) {
                if(data['2fa'] == 1) {
                    check2FAAuthentication(function(data1) {
                        if(data1['twofactorauth']) {
                            if(data.status === "200") {
                                next();
                            } else {
                               next({'name': 'error.403'}) 
                            }
                        } else {
                            // Show 2fa login page
                            location.replace("/login-2fa")
                        }
                    });
                } else {
                    if(data.status === "200") {
                        next();
                    } else if(data.status === "406") {
                        router.push({ name: "AuthLogin"});
                    } else {
                       next({'name': 'error.403'}) 
                    }
                }
            });
        } else if(to.matched.some(record => record.meta.requiresAuth)) {
            // Check the permission of the user.
            checkAuthentication(to.meta.permission, function(data) {
                if(data.status === "200") {
                    next();
                } else if(data.status === "406") {
                    router.push({ name: "AuthLogin"});
                } else {
                   next({'name': 'error.403'}) 
                }
            });
        }
    } else {
        next() 
    }
})

async function checkAuthentication(permission, callback) {
    await fetch("/api/auth/permission/" + permission, {
        method: 'GET', 
        mode: 'cors',
        cache: 'no-cache', 
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((resp) => resp.json()).then((data) => {
        callback(data);
    }).catch((e) => {
        return false;
    })
}


async function check2FAAuthentication(callback) {
    await fetch("/api/auth/user2FA", {
        method: 'GET', 
        mode: 'cors',
        cache: 'no-cache', 
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((resp) => resp.json()).then((data) => {
        callback(data);
    }).catch((e) => {
        callback(['twofactorauth'] == false);
    })
}



/*
    Create the Vue App with all the settings above.
 */
new Vue({
    el: '#app',
    router,
    store,
});
