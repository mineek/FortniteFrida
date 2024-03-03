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

try {
    Module.ensureInitialized("libboringssl.dylib");
} catch (err) {
    console.log("Loading libboringssl.dylib");
    Module.load("libboringssl.dylib");
}

var ssl_set_custom_verify;
var ssl_get_psk_identity;

ssl_set_custom_verify = new NativeFunction(
    Module.findExportByName("libboringssl.dylib", "SSL_set_custom_verify"),
    'void', ['pointer', 'int', 'pointer']
);

ssl_get_psk_identity = new NativeFunction(
    Module.findExportByName("libboringssl.dylib", "SSL_get_psk_identity"),
    'pointer', ['pointer']
);

function trust_me_bro(ssl, out_alert) {
    return 0;
}

var ssl_verify_result_t = new NativeCallback(function (ssl, out_alert) {
    trust_me_bro(ssl, out_alert);
}, 'int', ['pointer', 'pointer']);

Interceptor.replace(ssl_set_custom_verify, new NativeCallback(function (ssl, mode, callback) {
    ssl_set_custom_verify(ssl, mode, ssl_verify_result_t);
}, 'void', ['pointer', 'int', 'pointer']));

Interceptor.replace(ssl_get_psk_identity, new NativeCallback(function (ssl) {
    return "fortnite_is_love_fortnite_is_life";
}, 'pointer', ['pointer']));

console.log("Loaded SSL Bypass");

var CFURLCreateWithString = Module.findExportByName("CFNetwork", "CFURLCreateWithString");
Interceptor.attach(CFURLCreateWithString, {
    onEnter: function (args) {
        var url = ObjC.Object(args[1]);
        if (isMatch(url.toString())) {
            var newUrl = redirect;
            var pathAndQuery = url.toString().split("://")[1];
            pathAndQuery = pathAndQuery.split("/").slice(1).join("/");
            newUrl = newUrl + "/" + pathAndQuery;
            var newUrlStr = ObjC.classes.NSString.stringWithString_(newUrl);
            args[1] = newUrlStr;
        }
    }
});