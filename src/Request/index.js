// https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet
// https://developers.google.com/analytics/devguides/reporting/core/dimsmets

var ObjectBuilder = require("../ObjectBuilder");
var ApiHelper = require("../ApiHelper");

var Request = function() {}

Request.prototype = Object.create(new ObjectBuilder());

const makeDimensionObject = function(name) {
	return { name };
}

const makeHistogramObject = function(name, histogramBuckets = null) {
	var obj = makeDimensionObject(name);
	if(histogramBuckets) {
		obj.histogramBuckets = histogramBuckets;
	}
	return obj;
}

const makeMetricObject = function(name, type = "INTEGER") {
	return {
		expression:  name,
		formattingType: type ? type : "INTEGER"
	}
}

const makeFiltersObject = function(filters, operator = "OR") {
	return {
		operator,
		filters: filters.map(function(filter) {
			return filter.make();
		})
	}
}

Request.prototype.view = function(viewId) {
	viewId = ApiHelper.generateApiName(viewId);
	return this.set("viewId", viewId);
};

Request.prototype.pageSize = function(size) {
	return this.set("pageSize",size);
};

Request.prototype.results = function(count) {
	return this.pageSize(count);
}

Request.prototype.pageToken = function(token) {
	return this.set("pageToken",token);
};

Request.prototype.removePageToken = function(token) {
	return this.pageToken(null);
};

Request.prototype.offset = function(value) {
	return this.pageToken(value);
};

Request.prototype.removeOffset = function(value) {
	return this.pageToken(null);
};

Request.prototype.sample = function(size) {
	return this.set("samplingLevel",size.toUpperCase());
};

Request.prototype.fast = function() {
	return this.sample("SMALL");
};

Request.prototype.precise = function() {
	return this.sample("LARGE");
};

// Date functions

Request.prototype.dateRange = function(params) {
	var dateRange = {};
	if (params.from) {
		dateRange.startDate = params.from;
	}
	if (params.to) {
		dateRange.endDate = params.to;
	}
	// For now only 1 date range is permitted
	return this.set("dateRanges",[dateRange]);
};

Request.prototype.dimension = function(dimension) {
	dimension = ApiHelper.generateApiName(dimension);
	dimension = makeDimensionObject(dimension);
	return this.append("dimensions", dimension);
};

Request.prototype.histogram = function(dimension, histogramBuckets = null) {
	histogramBuckets = histogramBuckets.forEach(function(bucket) {
		return bucket.toString();
	});
	dimension = ApiHelper.generateApiName(dimension);
	dimension = makeHistogramObject(dimension, histogramBuckets);
	return this.set("dimensions", [dimension]);
};

Request.prototype.dimensions = function(...values) {
	values = this.getValues(values);
	values = values.map(ApiHelper.generateApiName);
	values = values.map(makeDimensionObject);
	return this.appendMultiple("dimensions",values);
};

Request.prototype.clearDimensions = function() {
	return this.clear("dimensions");
};

Request.prototype.removeDimension = function(name) {
	name = ApiHelper.generateApiName(name);
	return this.remove("dimensions", "name");
};

Request.prototype.removeDimensions = function(...values) {
	values = this.getValues(values);
	values = values.map(ApiHelper.generateApiName);
	return this.removeMultiple("dimensions", "name", values);
};

Request.prototype.metric = function(name, type) {
	name = ApiHelper.generateApiName(name);
	return this.append("metrics", makeMetricObject(name));
};

Request.prototype.metrics = function(...values) {
	values = this.getValues(values);
	values = values.map(ApiHelper.generateApiName);
	values = values.map(makeMetricObject);
	return this.appendMultiple("metrics", values);
};

Request.prototype.metricInt = function(name) {
	return this.metric(name, "INTEGER");
};

Request.prototype.nameFloat = function(name) {
	return this.metric(name, "FLOAT");
};

Request.prototype.nameCurrency = function(name) {
	return this.metric(name, "CURRENCY");
};

Request.prototype.namePercent = function(name) {
	return this.metric(name, "PERCENT");
};

Request.prototype.nameTime = function(name) {
	return this.metric(name, "TIME");
};

Request.prototype.clearMetrics = function() {
	return this.clear("metrics");
};

Request.prototype.removeMetric = function(name) {
	name = ApiHelper.generateApiName(name);
	return this.remove("metrics", "expression");
};

Request.prototype.removeMetrics = function(...values) {
	values = this.getValues(values);
	values = values.map(ApiHelper.generateApiName);
	return this.removeMultiple("dimensions", "name", values);
};

Request.prototype.filtersExpression = function(expression) {
	return this.set("filtersExpression", expression);
};

Request.prototype.orderBy = function(params) {
	return this.append("orderBys", {
		fieldName: ApiHelper.generateApiName(params.name),
		orderType: params.type ? params.type : "VALUE",
		sortOrder: params.order ? params.order : "DESCENDING"
	});
};

Request.prototype.orderAsc = function(name) {
	return this.orderBy({
		name: name,
		order: "ASCENDING"
	});
};

Request.prototype.orderDesc = function(name) {
	return this.orderBy({
		name: name
	});
};

Request.prototype.orderHistogram = function(name) {
	return this.orderBy({
		name: name,
		type: "HISTOGRAM_BUCKET"
	});
};

Request.prototype.removeOrder = function(name) {
	name = ApiHelper.generateApiName(name);
	return this.remove("orderBys", "fieldName", name);
};

Request.prototype.removeOrders = function(...values) {
	values = this.getValues(values);
	values = values.map(ApiHelper.generateApiName);
	return this.removeMultiple("orderBys", "fieldName", values);
};

Request.prototype.metricOrFilters = function(filters) {
	return this.filters("metricFilterClauses", filters, "OR");
};

Request.prototype.metricFilters = function(filters, operator = "AND") {
	return this.filters("metricFilterClauses", filters);
};

Request.prototype.metricFilter = function(filter) {
	return this.filter("metricFilterClauses", filter);
};

Request.prototype.dimensionOrFilters = function(filters) {
	return this.filters("dimensionFilterClauses", filters, "OR");
};

Request.prototype.dimensionFilters = function(filters, operator = "AND") {
	return this.filters("dimensionFilterClauses", filters);
};

Request.prototype.dimensionFilter = function(filter) {
	return this.filter("dimensionFilterClauses", filter);
};

Request.prototype.filters = function(type, filters) {
	filters = makeFiltersObject(filters);
	return this.append(type, filters);
};

Request.prototype.andFilters = function(type, filters) {
	filters = makeFiltersObject(filters, "AND");
	return this.append(type, filters);
};

Request.prototype.filter = function(type, filter) {
	return this.filters(type, [filter]);
};

module.exports = Request;