if(!self.define){let e,s={};const n=(n,a)=>(n=new URL(n+".js",a).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(a,i)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let c={};const t=e=>n(e,r),j={module:{uri:r},exports:c,require:t};s[r]=Promise.all(a.map((e=>j[e]||t(e)))).then((e=>(i(...e),c)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"849869e18cf0a97da2c3f0e811f7dfdb"},{url:"/_next/static/9bjxjUnW70jj-okrR0WKB/_buildManifest.js",revision:"8f77a20b2c6c27ca8335609a7e201923"},{url:"/_next/static/9bjxjUnW70jj-okrR0WKB/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1130.bcd3559a64ff3ce4.js",revision:"bcd3559a64ff3ce4"},{url:"/_next/static/chunks/1517-861f1d9b2a7edd27.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/1525-1d86014d80ee7bd5.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/1792-6af1cba5ba9a3ed0.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/1814-c08224799ec6c878.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/2138-3a9916f591367d6a.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/2694-3c47d12a967c417d.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/3680-176db0f86350bf35.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/3852-d461835cfea342a3.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/3861.88819ebdb87f6d42.js",revision:"88819ebdb87f6d42"},{url:"/_next/static/chunks/3871-cf34688d4b63fa51.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/4413.93dcec14807e1f96.js",revision:"93dcec14807e1f96"},{url:"/_next/static/chunks/4839-0e35f892ad262efe.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/4bd1b696-664ecb8b533d3c44.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/53c13509.f72242c87a328897.js",revision:"f72242c87a328897"},{url:"/_next/static/chunks/6126-1399f437c46ea151.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/6338-116460881a4ce2af.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/6670.10f71eec6c5276a6.js",revision:"10f71eec6c5276a6"},{url:"/_next/static/chunks/7134-95b39b1f617deeb0.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/7512-ea9d4daad73eff8b.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/795d4814-5bcb98f48b6cce9d.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/7970-b05d14e058894b5a.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/8050.597e645ce54c922e.js",revision:"597e645ce54c922e"},{url:"/_next/static/chunks/8060.d512d61a49723246.js",revision:"d512d61a49723246"},{url:"/_next/static/chunks/8370-695e7dcd91ed246f.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/8e1d74a4-9c730f7fcb1fe84c.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/9295-159b75da9508ae31.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/938157b5-345ffa3b266d09ff.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/9450-393be28c8f7b703b.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/9801-d96684f48c7cb4fa.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/9809-559bfbb7e7d80c1e.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/9c4e2130-d5cc25a174945890.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/_not-found/page-9a1c08ed2798cb0a.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/admin/page-3bd6385fdd2139ff.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/add-vehicle/route-6795eeea4c0d46c6.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/login/route-ffbd8bf70fb867b5.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/register/route-14060c40af469b96.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/resend-verification/route-96eabb5b6119da63.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/send-verification/route-0c079c998ef74689.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/upload/route-412615f35a34b41f.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/api/verify-driver/route-48c6a386399a1eb4.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/auth/forgot-password/page-9f35b39ac7e196aa.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/auth/login/page-4a543c5da44f21e8.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/auth/register/page-55f8050e8b8c43ea.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/dashboard/driver/bookings/page-e5e2852b34507564.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/dashboard/driver/page-dafd56cbca915474.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/dashboard/driver/rides/page-cd2668cf315538b1.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/dashboard/passanger/bookings/page-4db3f84aeea803c2.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/dashboard/passanger/page-eb1f7fb0613c4c13.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/feedback/page-ec2fd02d43770cbb.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/home/page-1c5c50ce93c18d2b.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/infos/page-b09490a76e59d694.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/layout-4eff934f90913736.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/page-5b0b9ab1f5c7d907.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/profile/page-81e97395227306ce.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/rides/%5Bid%5D/page-2bb5dc34f1cf2ae3.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/rides/history/page-0bb7ea517d0020ca.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/rides/page-7abe4a99508289f6.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/verify-driver/page-70d8f0456abd1501.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/app/verify-passenger/page-7b2c92fa2be10eec.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/bc9e92e6-4e4015420db57d0a.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/c916193b-b2c772a5dfcd3bcc.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/d0deef33.c494e469c3695ec3.js",revision:"c494e469c3695ec3"},{url:"/_next/static/chunks/ee560e2c-0b31930148e54f25.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/framework-b2870138c0c09ffc.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/main-6e5e9fc4918f2fc1.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/main-app-7100c7b72c06e99d.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/pages/_app-00b41aece417ee52.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/pages/_error-6b43ce36a8d09a61.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-e341e95fa2998b84.js",revision:"9bjxjUnW70jj-okrR0WKB"},{url:"/_next/static/css/400819551dad5ad1.css",revision:"400819551dad5ad1"},{url:"/_next/static/css/857aa62baa17c894.css",revision:"857aa62baa17c894"},{url:"/_next/static/media/4473ecc91f70f139-s.p.woff",revision:"78e6fc13ea317b55ab0bd6dc4849c110"},{url:"/_next/static/media/463dafcda517f24f-s.p.woff",revision:"cbeb6d2d96eaa268b4b5beb0b46d9632"},{url:"/_next/static/media/avatarprofile.1b4067c7.png",revision:"92a38bc961d03d53820d53a008346fbc"},{url:"/_next/static/media/covoiturage.8781d5dd.png",revision:"97456ae1800f92233e18a2987fde6e38"},{url:"/_next/static/media/header2.cfc32803.png",revision:"265b0ab4161ad66dbad9e341c4fbca29"},{url:"/_next/static/media/image.216c9ff3.png",revision:"52736c992346f55c29243d1303714a6e"},{url:"/_next/static/media/layers-2x.9859cd12.png",revision:"9859cd12"},{url:"/_next/static/media/layers.ef6db872.png",revision:"ef6db872"},{url:"/_next/static/media/marker-icon.d577052a.png",revision:"d577052a"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/firebase-messaging-sw.js",revision:"02fa7b8038e4ea5a687a5dc0ada2190c"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icon-192x192.png",revision:"485933529e01a772b04661183ec1be6b"},{url:"/icon-512x512.png",revision:"134cc63639e9115a33375e1a54c97ada"},{url:"/images/avatarprofile.png",revision:"92a38bc961d03d53820d53a008346fbc"},{url:"/images/covoiturage.png",revision:"97456ae1800f92233e18a2987fde6e38"},{url:"/images/header.png",revision:"1fba01d325947bc2cf7d6a1e3f900501"},{url:"/images/header2.png",revision:"265b0ab4161ad66dbad9e341c4fbca29"},{url:"/images/image.png",revision:"52736c992346f55c29243d1303714a6e"},{url:"/images/logofinal.jpeg",revision:"3b7efa926e274d392f8cd13bebdb914f"},{url:"/images/marker-icon.png",revision:"2273e3d8ad9264b7daa5bdbf8e6b47f8"},{url:"/images/marker-shadow.png",revision:"44a526eed258222515aa21eaffd14a96"},{url:"/manifest.json",revision:"a777f4fb6ee940b2c0dd7813b81c03ea"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/screenshots/desktop.png",revision:"9ca6e810a7f8cfd98ea93c4da8a49635"},{url:"/screenshots/mobile.png",revision:"3b09fcc7806af5725ef9e303eca65865"},{url:"/uploads/profile-pictures/D9pwjyOPl7TwYdeb84A3fddMZw13-1733345755222.png",revision:"31112a272a911da365da452282511897"},{url:"/uploads/profile-pictures/J5g8kSbjwneeAeKZTqvqxl9yPqy2-1733342762983.png",revision:"1bb5b4700bba89c00911a95201d364ec"},{url:"/uploads/profile-pictures/Sm4XkAh4V9WzXlacDiGLknpZkA92-1733351416953.jpg",revision:"43758bdf692f2dcbd42a729c6701c803"},{url:"/uploads/profile-pictures/TBeGkOZWPrWlM20m8rFgPrR1gYs2-1733344565705.jpg",revision:"bd218f03cedfd3a608865191b94460d8"},{url:"/uploads/profile-pictures/qlK49JtQsidPkzZk4NbtoIVxVz22-1732914374892-salix.png",revision:"455cea40e9c0b68d2d83d98e0f4f8342"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/video/covoi.mp4",revision:"644f55f943c7b408bbf3e82d419dac36"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:a})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
