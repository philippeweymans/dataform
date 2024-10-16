
// // const commonAssertions = require("dataform-assertions");
// const commonAssertions = require("../index");

// const commonAssertionsResult = commonAssertions({
//   globalAssertionsParams: {
//     // If not provided, the default Dataform project config will be used
//     "database": "boelpadel",
//     "schema": "dataform",
//     "location": "eu",
//     "tags": ["global-assertions-tag"],
//     "disabledInEnvs": ["dv"] // Check match with 'dataform.projectConfig.vars.env' value
//   },
//   rowConditions: {
//     "dataform": {
//       "vw_afhaal_producten": {
//             "product_vithit_": "product='VITHIT APPEL'",
//       }
//     }
//   }
// });