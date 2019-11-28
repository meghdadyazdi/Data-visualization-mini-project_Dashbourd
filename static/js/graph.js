queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);


function makeGraphs(error, salaryData) {
    var ndx=crossfilter(salaryData);

    
    show_gender_balance(ndx);
    show_discipline_selector(ndx); //-------------step 2-------------

   dc.renderAll();

}

function show_gender_balance(ndx){
    var dim=ndx.dimension(dc.pluck('sex'));
    var group=dim.group();

    dc.barChart("#gender-balance")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);

}


// ---------------------------------step 2---------------------------------------
function show_discipline_selector(ndx){
    var dim=ndx.dimension(dc.pluck('discipline'));
    var group=dim.group();
    dc.selectMenu("#discipline-selector")
        .dimension(dim)
        .group(group);
}
