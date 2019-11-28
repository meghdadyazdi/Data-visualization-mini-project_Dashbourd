queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);


function makeGraphs(error, salaryData) {
    var ndx=crossfilter(salaryData);


    salaryData.forEach(function(d){      // Salary data is in text 
        d.salary = parseInt(d.salary);
    })

    
    show_gender_balance(ndx);
    show_discipline_selector(ndx); //-------------step 2-------------
    show_average_salary(ndx); //-------------step 3-------------

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
        // .elasticY(true) // coment it to keep the Y-axis fixed when select A:181 0r B:216
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

// ---------------------------------step 3---------------------------------------
function show_average_salary(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    
    function add_item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
    }

    function remove_item(p, v) {
        p.count--;
        if(p.count == 0) {
            p.total = 0;
            p.average = 0;
        } else {
            p.total -= v.salary;
            p.average = p.total / p.count;
        }
        return p;
    }
    
    function initialise() {
        return {count: 0, total: 0, average: 0};
    }

    var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#average-salary")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageSalaryByGender)
        //we used custom reducer so we neet to use valueAccessor() because the value that is being plotted
        // is created in the initialise function of our custom reducer
        .valueAccessor(function(d){ // 
            return d.value.average.toFixed(2); // toFixed(2) rounds the average value to two decimal places
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(4);
}