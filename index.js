const express = require("express");
const axios = require("axios");
const SapCfAxios = require("sap-cf-axios").default;
const xsenv = require('@sap/xsenv')
const https = require('https');

xsenv.loadEnv();
const dest_service = xsenv.getServices({ dest: { tag: 'destination'} }).dest;
const uaa_service = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;
const sUaaCredentials = dest_service.clientid + ':' + dest_service.clientsecret;
const sDestinationName = 'NorthWindDestination';

const app = express();
const PORT = process.env.PORT || 5000;

// console.log(xsenv.getServices({ dest: { tag: 'destination'} }));
// console.log(xsenv.getServices({ uaa: { tag: 'xsuaa' } }));
// console.log(sUaaCredentials);

const axios1 = SapCfAxios("NorthWindDestination");

const handleCustomerRequest = async(req,res) => {
    // const response = await axios1({
    //     method: "GET",
    //     url:  "/v4/northwind/northwind.svc/Customers",
    //     params: {
    //         $format: "json"
    //     },
    //     headers: {
    //         accept: "application/json"
    //     }
    // });
    // res.send(response.data.value);

    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
    axios({
        url: uaa_service.url + '/oauth/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(sUaaCredentials).toString('base64'),
            'Content-type': 'application/x-www-form-urlencoded'
        },
        data: {
            'client_id': dest_service.clientid,
            'grant_type': 'client_credentials'
        },        
        httpsAgent: agent,          
    }).then((response) => {
        const token = response.data.access_token;
        console.log(token);
        const token_type = response.data.token_type;
        const agent2 = new https.Agent({  
            rejectUnauthorized: false
          });       
        axios({
            url: dest_service.uri + '/destination-configuration/v1/destinations/' + sDestinationName,
            headers: {
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: agent2,       
        }).then((response) => {
            console.log(response.data.destinationConfiguration)
            const destinationConfiguration = response.data.destinationConfiguration;
            const agent2 = new https.Agent({  
                rejectUnauthorized: false
              });             
            axios({
                url: destinationConfiguration.URL + "/v4/northwind/northwind.svc/Customers",
                method: "GET",
                params: {
                    $format: "json"
                },
                headers: {
                    accept: "application/json"
                },
                httpsAgent: agent2,
            }).then((response) => {
                res.send(response.data.value);
            })
    // const response = await axios1({
    //     method: "GET",
    //     url:  "/v4/northwind/northwind.svc/Customers",
    //     params: {
    //         $format: "json"
    //     },
    //     headers: {
    //         accept: "application/json"
    //     }
    // });
    // res.send(response.data.value);            
        })
    })
}

app.get("/Customers", handleCustomerRequest);

app.listen(PORT,() => {
    console.log(`Listening on Port http://localhost:${PORT}`)
})
