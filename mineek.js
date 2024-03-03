// Usage: frida -U -l mineek.js -f re.frida.Gadget

var patterns = [
    /.*\.ol\.epicgames\.com/
];

var redirect = "https://backend.ploosh.dev";

function isMatch(url) {
    for (var i = 0; i < patterns.length; i++) {
        if (patterns[i].test(url)) {
            return true;
        }
    }
    return false;
}

function main() {
    var curl_easy_setopt = Module.findExportByName("libUE4.so", "curl_easy_setopt");
    Interceptor.attach(curl_easy_setopt, {
        onEnter: function (args) {
            var option = args[1].toInt32();
            // CURLOPT_URL
            if (option == 10002) {
                var url = args[2].readCString();
                if (isMatch(url)) {
                    var newUrl = redirect;
                    var pathAndQuery = url.split("://")[1];
                    pathAndQuery = pathAndQuery.split("/").slice(1).join("/");
                    newUrl = newUrl + "/" + pathAndQuery;
                    Memory.writeUtf8String(args[2], newUrl);
                }
            }
            // CURLOPT_SSL_VERIFYPEER ( for bypassing SSL pinning )
            else if (option == 64) {
                args[2] = NULL;
            }
            // CURLOPT_SSL_VERIFYHOST ( for bypassing SSL pinning )
            else if (option == 81) {
                args[2] = NULL;
            }
        }
    });
    Java.perform(function () { 
        var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();
        Java.scheduleOnMainThread(function() {
            var toast = Java.use("android.widget.Toast");
            toast.makeText(context, Java.use("java.lang.String").$new("Mobile SSL bypass and redirect by @mineekdev\nMade for Astro and Astro only - discord.gg/astrofn"), 1).show();
        });
    });
}

setTimeout(function() {
    main();
}, 2000);
