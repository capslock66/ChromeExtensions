function Request() {
    this.headers = {};
    this.body = null;
    this.method = "GET";
    this.url = "http://";

    this.xhr = null;
    this.nameE = null;		// element
    this.valueE = null;
    this.hname = "";		// header name
    this.hvalue = "";		// header value
}

Request.request = new Request();

function main()
{
    console.log("staring main()");
}

main();
