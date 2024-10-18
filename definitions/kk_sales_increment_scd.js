// const scd = require("../(OBSOLETE) index_scd");

const scd = require("../index_scd");

/**
 * Create an SCD table on top of the fake table defined in.
 */

const { updates, view } = scd("kk_sales_increment_scd", {
  // A unique identifier for rows in the table.
  uniqueKey: "Id",
  // A field that stores a timestamp or date of when the row was last changed.
  timestamp: "RecordCreationDate",
  // A field that stores the hash value of the fields that we want to track changes in. If you do not want to use the hash comparison, you may omit this field or set it to null
  hash: "hash_value",
  // The source table to build slowly changing dimensions from.
  source: {
    schema: "kk_sales_increment_scd",
    name: "kk_sales_increment_source",
  },
  // Any tags that will be added to actions.
  tags: ["scd-sales"],
  // Optional documentation of table columns
  columns: {Id: "Unique ID"},
  // Any configuration parameters to apply to the incremental table that will be created.
  incrementalConfig: {
    bigquery: {
      partitionBy: "CreatedOnDt",
    },
  },
});

// Additional customization of the created models can be done by using the returned actions objects.
updates.config({
  // You can specify the output schema here if it is different than the default
  schema: "kk_sales_increment_scd",
  description: "Updates table for SCD",
});