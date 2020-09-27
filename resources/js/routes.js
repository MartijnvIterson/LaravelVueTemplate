// Webzey | Components
import Header from './components/layout/Header.vue';
import Footer from './components/layout/Footer.vue';
// Webzey | Home
import Home from './components/pages/Home.vue';



// Dashboard | Direct
const DashboardOverview = resolve => {
    require.ensure(['./components/pages/dashboard/Overview.vue'], () => {
        resolve(require('./components/pages/dashboard/Overview.vue'));
    }, 'js/dashboard');
};


export const routes = [
    {
        path: '/', name: 'homePage', children: [

        ], components: {
            'webzeyHeader': Header,
            default: Home,
            'webzeyFooter': Footer
        }
    },
    {
        path: '/dashboard', name: 'Dashboard', children: [
            {
                path: '/overview', name: 'DashboardOverview', children: [
        
                ], components: {
                    'webzeyHeader': Header,
                    default: DashboardOverview,
                    'webzeyFooter': Footer
                }
            },
        ], components: {
            'webzeyHeader': Header,
            default: Dashboard,
            'webzeyFooter': Footer
        }
    },
];