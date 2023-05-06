
'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const recipeSchema = Schema( {
  type: {type: String, required: true},
  preference: {type: String},
  restriction: {type: String},
  title: {type: String},
  content: {type: String},
  createdDate: {type: Date, default: Date.now},
  userId: {type:ObjectId, ref:'user'}
} );

module.exports = mongoose.model( 'Recipe', recipeSchema );
