// const scd = require("dataform-scd");

// scd("source_data_scd", {
//   // A unique identifier for rows in the table.
//   uniqueKey: "user_id",
//   // A field that stores a timestamp or date of when the row was last changed.
//   timestamp: "updated_at",
//     // A field that stores the hash value of the fields that we want to track changes in. If you do not want to use the hash comparison, you may omit this field or set it to null
//     hash: "hash_value", // OPTIONAL
//     // The source table to build slowly changing dimensions from.
//     source: {
//       schema: "dataform_scd_example",
//       name: "source_data",
//   },
//   // Any configuration parameters to apply to the incremental table that will be created.
//   incrementalConfig: {
//     bigquery: {
//       partitionBy: "updated_at",
//     },
//   },
// });