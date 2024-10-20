/**
 * Builds a type-2 slowly changing dimensions table and view.
 */
module.exports = (
    name,
    { uniqueKey, hash, timestamp, source, tags, incrementalConfig, columns = {} }
) => {
  // Create an incremental table with just pure updates, for a full history of the table.
  const updates = publish(`${name}_updates`, {
    type: "incremental",
    schema: "kk_sales_increment_scd",
    tags,
    columns,
    ...incrementalConfig,
  }).query(
    !!hash ?
       (ctx) => `
    ${ctx.when(
          ctx.incremental(), 
          // `WITH ids_to_update AS (SELECT ${uniqueKey}, ${hash} FROM ${ctx.ref(source)}),\  
          // maxDt AS (SELECT ${uniqueKey}, MAX(updated_at) AS updated_at FROM ${ctx.self()} GROUP BY ${uniqueKey}), \ 
          // ids_trgt AS ( SELECT B.${uniqueKey},B.${hash} B.updated_at FROM ${ctx.self()} B JOIN maxDt ON (maxDt.${uniqueKey}=B.${uniqueKey} AND maxDt.updated_at=B.updated_at)), \
          // ids_to_update2 as (SELECT ${uniqueKey}, ${hash} FROM ids_to_update \
          // EXCEPT DISTINCT \
          // SELECT ${uniqueKey},${hash} FROM ids_trgt)`
          
          `WITH ids_to_update_prep as (
          select ${uniqueKey}, ${hash}, ${timestamp}, max(${timestamp}) over (partition by ${uniqueKey}) as maxDt 
          from ${ctx.self()}),
          ids_to_update as
          (SELECT ${uniqueKey}, ${hash} FROM ${ctx.ref(source)}
          EXCEPT DISTINCT
          select ${uniqueKey}, ${hash} from ids_to_update_prep where ${timestamp}=maxDt)`
          )}

      select * from ${ctx.ref(source)}
      ${ctx.when(
          ctx.incremental(),  
          `where 1=1 
        and ${uniqueKey} in (select ${uniqueKey} from ids_to_update)`
        // ${timestamp} > (select max(${timestamp}) from ${ctx.self()})
      )}`
    :
  (ctx) => `
      select * from ${ctx.ref(source)}
      ${ctx.when(
        ctx.incremental(),
        `where ${timestamp} > (select max(${timestamp}) from ${ctx.self()})`
      )}`
  );


  // Create a view on top of the raw updates table that contains computed valid_from and valid_to fields.
  const view = publish(name, {
    type: "view",
    schema: "kk_sales_increment_scd",
    tags,
    columns: {
      ...columns,
      scd_valid_from: `The timestamp from which this row is valid for the given ${uniqueKey}.`,
      scd_valid_to: `The timestamp until which this row is valid for the given ${uniqueKey}, or null if this it the latest value.`,
    },
  }).query(
      (ctx) => `
  select
    *,
    ${timestamp} as scd_valid_from,
    lead(${timestamp}) over (partition by ${uniqueKey} order by ${timestamp} asc) as scd_valid_to
  from
    ${ctx.ref(updates.proto.target.schema, `${name}_updates`)}
  `
  );

  // Returns the tables so they can be customized.
  return { view, updates };
};