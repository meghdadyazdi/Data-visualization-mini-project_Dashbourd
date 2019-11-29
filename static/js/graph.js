queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);


function makeGraphs(error, salaryData) {
    var ndx=crossfilter(salaryData);


    salaryData.forEach(function(d){      // Salary data is in text //-------------step 3-------------
        d.salary = parseInt(d.salary);
        d.yrs_service = parseInt(d["yrs.service"]); //-------------step 6-------------
    })

    
    show_gender_balance(ndx);
    show_discipline_selector(ndx); //-------------step 2-------------
    show_average_salary(ndx); //-------------step 3-------------
    show_rank_distribution(ndx); //-------------step 4-------------

    show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors"); //-------------step 5-------------
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors"); //-------------step 5-------------

    
    // ُScatter plots are ideal for showing the correlation between two different data items.
    show_service_to_salary_correlation(ndx); //-------------step 6-------------



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

// ---------------------------------step 4---------------------------------------
function show_rank_distribution(ndx) {
    
    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
            function (p, v) {
                p.total++;
                if(v.rank == rank) {
                    p.match++;
                }
                return p;
            },
            function (p, v) {
                p.total--;
                if(v.rank == rank) {
                    p.match--;
                }
                return p;
            },
            function () {
                return {total: 0, match: 0};
            }
        );
    }
    
    var dim = ndx.dimension(dc.pluck("sex"));
    var profByGender = rankByGender(dim, "Prof");
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");
    
    dc.barChart("#rank-distribution")
        .width(400)
        .height(300)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "Asst Prof")
        .stack(assocProfByGender, "Assoc Prof")
        // The total part of the data structure, our value, is the total number of men or women that have been found. 
        // And then the match is the number of those that are professors, assistant professors, associate professors, and so on.
        // So what we need to do for each value that we're plotting is find what percentage of the total is the match.
        .valueAccessor(function(d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            } else {
                return 0;
            }
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5))
        .margins({top: 10, right: 100, bottom: 30, left: 30});
}

// ---------------------------------step 5---------------------------------------
function show_percent_that_are_professors(ndx, gender, element) {
    // Now this time, we're just calculating a number.
    // We're not actually plotting data on a chart, so we don't need a dimension and a group.
    var percentageThatAreProf = ndx.groupAll().reduce(
        function(p, v) {
            if (v.sex === gender) {
                p.count++;
                if(v.rank === "Prof") {
                    p.are_prof++;
                }
            }
            return p;
        },
        function(p, v) {
            if (v.sex === gender) {
                p.count--;
                if(v.rank === "Prof") {
                    p.are_prof--;
                }
            }
            return p;
        },
        function() {
            return {count: 0, are_prof: 0};    
        },
    );
    
    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%")) //show this number as a percentage to 2 decimal places.
        .valueAccessor(function (d) {
            if (d.count == 0) {
                return 0;
            } else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageThatAreProf)
}


// ---------------------------------step 6---------------------------------------
function show_service_to_salary_correlation(ndx) {
    
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    // The first dimension is going to be on years of service,
    // and we only use this to work out the bounds of the x-axis,
    // the minimum and maximum years of service that we need to plot.
    var eDim = ndx.dimension(dc.pluck("yrs_service"));

    // The second dimension that we create actually returns an array with two parts: one being the years of service, and the other being the salary.
    // And this is what allows us to plot the dots of the scatter plot at the right x and y coordinates.
    // So eDim here is just a simple pluck on the years of service.
    // And experienceDim is going to use a function here to extract the two pieces of information that we need for plotting the dots.
    var experienceDim = ndx.dimension(function(d) {
       return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();
    
    var minExperience = eDim.bottom(1)[0].yrs_service;
    var maxExperience = eDim.top(1)[0].yrs_service;
    
    dc.scatterPlot("#service-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .xAxisLabel("Years Of Service")
        .title(function(d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) { //All the colorAccessor() does is decide which piece of data we use as an input into our genderColors scale
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}