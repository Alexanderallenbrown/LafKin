//four bar props


//left rear suspension
//use the coordinates of fixed link
//as the driver for this?
//how will I enfore contact patch?

//give 3 points on lower A arm
//in local coords. y left, x fwd, z up.
// [x1,y1,z1,x2,y2,z2,x3,y3,z3]
// point 1 closest to rear, point 3 kingpin
//origin of an a-arm is fixed to rear inner point
const lowerA = [[0,0,0],[.3,0,0],[.15,.4,0]]
const upperA = [[0,0,0],[.3,0,0],[.15,.35,0]]
//for chassis, p1 lower a p1, p2 lower a, p3 upper a p1, p4 upper a p2, p5 tie rod conn
const chassis = [[0,.2,-.09],[.3,.2,-.09],[0,0.2,.09],[.3,0.2,.09],[-.05,0.22,-.09]]
var rackY = chassis[4][1]
//for upright, p1 lower A-arm conn, p2 upper A-arm conn, p3 tie rod conn, wheel center loc,wheel angular offset
const upright = [[0,0,0],[0,0,0.2],[-0.1,0,0.1],[0,4*.0254,.1],[-.2,0,0]]

const tierodlength = 0.38

var sinphi = 0

//create a global variable to hold the suspension object.
var suspConfig = {};
suspConfig.lowerA = lowerA
suspConfig.upperA = upperA
suspConfig.chassis = chassis
suspConfig.upright = upright
suspConfig.tierodlength = tierodlength
suspConfig.rackY = rackY
suspConfig.camber_offset = 0.2

suspConfig.steering_ratio = .0254/(180.0)

//update the HTML to reflect this initial config.
updateSuspTextBoxes(suspConfig)

var savedConfig = varcopy(suspConfig)




//create a variable to hold suspension object
var susp;

var tnow =0;
var told = 0;
var dt = .015


//variables to interact with the user:
var wheelslider = document.getElementById("wheelslider")
var autosolve_checkbox = document.getElementById("autoSolve")
var wheelpos = 0;
var chassisroll = 0;
var rackdisp = 0;



let inconsolata;
function preload() {
  inconsolata = loadFont('assets/Inconsolata.otf');
}

/////////////////////////////////////////

function setup() {

  var cnv = createCanvas(windowWidth/2, 500,WEBGL);
  cnv.parent('sketch-holder')
  initLineChart([],"Choose plot options below, then hit 'generate plot' ","Independent variable","Dependent Variable")
  susp = new Suspension(lowerA,upperA,upright,chassis,tierodlength);
  susp.draw()
  print(wheelslider)
  print(autosolve_checkbox)
  camera(-1000,-1000,2500,-500,0,0,0,1,0)

  textFont(inconsolata);
  textSize(10);
  textAlign(CENTER, TOP);
}

function draw() {
  tnow = millis()/1000.0
  dt = tnow-told
  told = tnow
  background(50);
  orbitControl();
  // setAttributes('antialias', true);
  // frustum(-width/2, width/2, -height/2, height, 0, max(width, height))
  fill(0)
  stroke(0)

  


  if(!simulating){
      //see if we want auto-solve on
      //use the slider to update the wheel position.
      susp.uprightGlobal[2] = wheelpos+(suspConfig.chassis[0][2])
      susp.chassisGlobal[3] = chassisroll
      susp.chassis[4][1] = suspConfig.rackY+rackdisp
      var autosolve_now = autosolve_checkbox.checked;
      if(autosolve_now){
          susp.solve();
      }

      susp.draw();
  }
  else{
      
      ////we are supposed to be running an automatic simulation now.
      simstr = "simulating"

      if(globalXData.length<=simlength){
        // simstr+="."
        // print(simstr)
        // print(globalXData.length)
        ////check to see what the independent variable is
        simxtype = document.getElementById("chart_x_axis").value;
        // print("Read Sim X type: "+simxtype)
        if(simxtype == "Jounce"){
          //now we set the simulation's input to the last element in the input array
          susp.uprightGlobal[2] = globalXData.slice(-1)[0]+suspConfig.chassis[0][2] //TODO
          if(globalXData.length==1){
            susp.solve();
          }
        }
        else if(simxtype=="Roll"){
          susp.chassisGlobal[3] = globalXData.slice(-1)[0]
        }
        else if(simxtype=="HandWheel"){
          print(suspConfig.steering_ratio*globalXData.slice(-1)[0])
          susp.chassis[4][1] = suspConfig.steering_ratio*globalXData.slice(-1)[0] + suspConfig.rackY
        }
        else{
          simulating = false;
          print("Simtype Not Supported (independent)")
        }
        ////now the simulation should be set up to solve with correct input.
        susp.update();


        ///// now the simulation should be updated. Add the desired output to the global Y data vector
        simytype = document.getElementById("chart_y_axis").value;
        if(simytype== "Camber"){
          globalYData.push(-(susp.uprightGlobal[3]%(2*PI)))
        }
        else if(simytype == "Steer"){
          globalYData.push((susp.uprightGlobal[5]%(2*PI)))
        }
        else{
          print("Simtype Not Supported (dependent)")
        }
        //add a new element to globalXdata if we're not at the end of the simulation.
        //if(!(globalXData.length==simlength)){
        //if(susp.itercount<susp.iter_limit){
        globalXData.push(globalXData.slice(-1)[0]+input_increment);
        //}
      }
      //turn off sim
      else{
        //this means that the simulation just ended. turn these into data for the chart.
        simulating = false;
        newChartData = generateData(globalXData,globalYData);
        suspPlot.data.datasets[0].data = newChartData;
        suspPlot.options.scales.yAxes[0].scaleLabel.labelString = simytype;
        suspPlot.options.scales.xAxes[0].scaleLabel.labelString = simxtype;
        suspPlot.options.title.text = simytype+" vs. "+simxtype;
        document.getElementById("plotfilename").value = simytype+"_vs_"+simxtype
        suspPlot.update();
      }
  }







/////// END DRAW ////////
}


















function reloadConfig(){
  suspConfig = varcopy(savedConfig)
  updateSuspTextBoxes(savedConfig)
  updateGeometry()
  susp.solve()
}

//callbacks for these functions:
wheelslider.oninput = function(){
  wheelpos = this.value/1000.0;
  //print("wheel pos udpate: " +str(this.value))
}

//callbacks for these functions:
rackslider.oninput = function(){
  rackdisp = this.value/1000.0;
  //print("wheel pos udpate: " +str(this.value))
}

//callbacks for these functions:
rollslider.oninput = function(){
  chassisroll = this.value/1000.0;
  //print("wheel pos udpate: " +str(this.value))
}

function windowResized() {
  resizeCanvas(windowWidth/2, 750);
  susp.fbscale = 2*windowWidth
}

function saveConfig(){
  myConfig = getSuspPointsFromHTML()
  downloadJSON(JSON.stringify(myConfig,null,"\t"),document.getElementById("configfilename").value+".txt")

}


//this is the callback fro the load config button.
function loadConfig(){
  // document.getElementById('attachment').click();
  const content = document.querySelector('.content');
  const [file] = document.querySelector('input[type=file]').files;
  const reader = new FileReader()
  reader.addEventListener("load", () => {
    // this will then display a text file
    print("NEW CONFIG LOADING:")
    print(reader.result);
    newConfig = JSON.parse(reader.result)
    savedConfig = newConfig
    updateSuspTextBoxes(newConfig)
    updateGeometry()

  }, false);

  if (file) {
    reader.readAsText(file);
  }


  
}

function updateIndependentRange(){
  var simxtype = document.getElementById("chart_x_axis").value;
  if(simxtype=="HandWheel"){
    document.getElementById("input_min").value="-180"
    document.getElementById("input_inc").value="1"
    document.getElementById("input_max").value="180"
  }
  else if(simxtype=="Roll"){
    document.getElementById("input_min").value="-.1"
    document.getElementById("input_inc").value=".001"
    document.getElementById("input_max").value=".1"
  }
  else{
    document.getElementById("input_min").value="-.0254"
    document.getElementById("input_inc").value=".001"
    document.getElementById("input_max").value=".0254"
  }
  
}



//this is the callback for the update button.
function updateGeometry(){
  //zero out all sliders TODO
  document.getElementById("wheelslider").value = 0
  document.getElementById("rackslider").value = 0
  document.getElementById("rollslider").value = 0
  wheelpos = 0
  rackdisp = 0
  chassisroll = 0

  //get a new global suspension config.
  suspConfig = getSuspPointsFromHTML();
  print("got: " +str(suspConfig.chassis[4][1])+" for ctr-y")
  //feed new config into new globals
  newGlobals = guessGlobalsFromConfig(suspConfig);

  //update suspension object as appropriate
  //susp is a global variable. Not sure this is really the right way to do this...
  susp.upperA = suspConfig.upperA
  susp.lowerA = suspConfig.lowerA
  susp.chassis = suspConfig.chassis 
  susp.upright = suspConfig.upright
  susp.tierodlength = suspConfig.tierodlength
  susp.chassisGlobal = newGlobals.chassisGlobal
  susp.upperAGlobal = newGlobals.upperAGlobal
  susp.lowerAGlobal = newGlobals.lowerAGlobal
  susp.uprightGlobal = newGlobals.uprightGlobal
  //now solve suspension
  susp.solve()
  
  print("susp object says: "+str(susp.chassis[4][1])+" for ctr-y")

}


//this is a utility function to download config as a JSON text file.
function downloadJSON(content, fileName) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


///this takes a JSON suspension config and updates the HTML textboxes to match.
function updateSuspTextBoxes(myConfig){
    //lower a arm rear in chassis frame
    document.getElementById("lar-x").value = myConfig.chassis[0][0]
    document.getElementById("lar-y").value = myConfig.chassis[0][1]
    document.getElementById("lar-z").value = myConfig.chassis[0][2]
    //lower a arm front in chassis frame
    document.getElementById("laf-x").value = myConfig.chassis[1][0]
    document.getElementById("laf-y").value = myConfig.chassis[1][1]
    document.getElementById("laf-z").value = myConfig.chassis[1][2]
    //upper a arm rear in chassis frame
    document.getElementById("uar-x").value = myConfig.chassis[2][0]
    document.getElementById("uar-y").value = myConfig.chassis[2][1]
    document.getElementById("uar-z").value = myConfig.chassis[2][2]
    //upper a arm front in chassis frame
    document.getElementById("uaf-x").value = myConfig.chassis[3][0]
    document.getElementById("uaf-y").value = myConfig.chassis[3][1]
    document.getElementById("uaf-z").value = myConfig.chassis[3][2]
     //lower a arm ball joint in A ARM frame

    document.getElementById("lalbj-x").value = myConfig.lowerA[2][0]
    document.getElementById("lalbj-y").value = myConfig.lowerA[2][1]
    document.getElementById("lalbj-z").value = myConfig.lowerA[2][2]
    //upper a arm ball joint in A ARM frame
    document.getElementById("uaubj-x").value = myConfig.upperA[2][0]
    document.getElementById("uaubj-y").value = myConfig.upperA[2][1]
    document.getElementById("uaubj-z").value = myConfig.upperA[2][2]
    //upright upper ball joint point
    document.getElementById("urubj-x").value = myConfig.upright[1][0]
    document.getElementById("urubj-y").value = myConfig.upright[1][1]
    document.getElementById("urubj-z").value = myConfig.upright[1][2]
    //upright lower ball joint point (should be 0 0 0)
    document.getElementById("urlbj-x").value = myConfig.upright[0][0]
    document.getElementById("urlbj-y").value = myConfig.upright[0][1]
    document.getElementById("urlbj-z").value = myConfig.upright[0][2]
    //upright tie rod point
    document.getElementById("urtr-x").value = myConfig.upright[2][0]
    document.getElementById("urtr-y").value = myConfig.upright[2][1]
    document.getElementById("urtr-z").value = myConfig.upright[2][2]
    //chassis tie rod point
    document.getElementById("ctr-x").value = myConfig.chassis[4][0]
    document.getElementById("ctr-y").value = myConfig.chassis[4][1]
    document.getElementById("ctr-z").value = myConfig.chassis[4][2]

    document.getElementById("tierod-length").value = myConfig.tierodlength
    document.getElementById("camber-offset").value = myConfig.camber_offset

    document.getElementById("urwc-x").value = myConfig.upright[3][0]
    document.getElementById("urwc-y").value = myConfig.upright[3][1]
    document.getElementById("urwc-z").value = myConfig.upright[3][2]

    document.getElementById("steering-ratio").value = myConfig.steering_ratio

}


//this creates a JSON suspension config object.
function getSuspPointsFromHTML(){
  //get values one at a time from the text boxes

  //lower a arm rear in chassis frame
  var lar_x = float(document.getElementById("lar-x").value)
  var lar_y = float(document.getElementById("lar-y").value)
  var lar_z = float(document.getElementById("lar-z").value)
  //lower a arm front in chassis frame
  var laf_x = float(document.getElementById("laf-x").value)
  var laf_y = float(document.getElementById("laf-y").value)
  var laf_z = float(document.getElementById("laf-z").value)
  //upper a arm rear in chassis frame
  var uar_x = float(document.getElementById("uar-x").value)
  var uar_y = float(document.getElementById("uar-y").value)
  var uar_z = float(document.getElementById("uar-z").value)
  //upper a arm front in chassis frame
  var uaf_x = float(document.getElementById("uaf-x").value)
  var uaf_y = float(document.getElementById("uaf-y").value)
  var uaf_z = float(document.getElementById("uaf-z").value)
  //lower a arm ball joint in A ARM frame
  var lalbj_x = float(document.getElementById("lalbj-x").value)
  var lalbj_y = float(document.getElementById("lalbj-y").value)
  var lalbj_z = float(document.getElementById("lalbj-z").value)
  //upper a arm ball joint in A ARM frame
  var uaubj_x = float(document.getElementById("uaubj-x").value)
  var uaubj_y = float(document.getElementById("uaubj-y").value)
  var uaubj_z = float(document.getElementById("uaubj-z").value)
  //upright upper ball joint point
  var urubj_x = float(document.getElementById("urubj-x").value)
  var urubj_y = float(document.getElementById("urubj-y").value)
  var urubj_z = float(document.getElementById("urubj-z").value)
  //upright lower ball joint point (should be 0 0 0)
  var urlbj_x = float(document.getElementById("urlbj-x").value)
  var urlbj_y = float(document.getElementById("urlbj-y").value)
  var urlbj_z = float(document.getElementById("urlbj-z").value)

  //upright tie rod point
  var urtr_x = float(document.getElementById("urtr-x").value)
  var urtr_y = float(document.getElementById("urtr-y").value)
  var urtr_z = float(document.getElementById("urtr-z").value)

  //upright wheel center
  //upright tie rod point
  var urwc_x = float(document.getElementById("urwc-x").value)
  var urwc_y = float(document.getElementById("urwc-y").value)
  var urwc_z = float(document.getElementById("urwc-z").value)

  //chassis tie rod point
  var ctr_x = float(document.getElementById("ctr-x").value)
  var ctr_y = float(document.getElementById("ctr-y").value)
  var ctr_z = float(document.getElementById("ctr-z").value)

  //tie rod length
  var trl = float(document.getElementById("tierod-length").value)
  //camber offset
  var camber_offset = float(document.getElementById("camber-offset").value)

  var steering_ratio = float(document.getElementById("steering-ratio").value)

  const newConfig = {}

  //turn this into local coordinates
  newConfig.chassis = [[lar_x,lar_y,lar_z],[laf_x,laf_y,laf_z],[uar_x,uar_y,uar_z],[uaf_x,uaf_y,uaf_z],[ctr_x,ctr_y,ctr_z]]
  LA12 = math.sqrt(math.pow(newConfig.chassis[0][0]-newConfig.chassis[1][0],2) + math.pow(newConfig.chassis[0][1]-newConfig.chassis[1][1],2)+math.pow(newConfig.chassis[0][2]-newConfig.chassis[1][2],2))
  UA12 = math.sqrt(math.pow(newConfig.chassis[2][0]-newConfig.chassis[3][0],2) + math.pow(newConfig.chassis[2][1]-newConfig.chassis[3][1],2)+math.pow(newConfig.chassis[2][2]-newConfig.chassis[3][2],2))

  newConfig.lowerA = [[0,0,0],[LA12,0,0],[lalbj_x,lalbj_y,lalbj_z]]
  newConfig.upperA = [[0,0,0],[UA12,0,0],[uaubj_x,uaubj_y,uaubj_z]]
  newConfig.upright = [[urlbj_x,urlbj_y,urlbj_z],[urubj_x,urubj_y,urubj_z],[urtr_x,urtr_y,urtr_z],[urwc_x,urwc_y,urwc_z],[-camber_offset,0,0]]
  newConfig.rackY = ctr_y
  newConfig.tierodlength = trl
  newConfig.camber_offset = camber_offset
  newConfig.steering_ratio = steering_ratio

  return newConfig
}


//this takes a suspension config and produces rough guesses
//this function should only be called when geometry is changed. 
function guessGlobalsFromConfig(myConfig){
//this function creates rough guesses for the suspension components' 
//global position/orientation vectors based on a config.

  // //now create global coordinates for each body
  // //format [X,Y,Z,r,p,y] for each body
  // var chassisGlobal= [0,0,0,0,0,0]
  // var lowerAGlobal = [chassisGlobal[0]+chassis[0][0],chassisGlobal[1]+chassis[0][1],chassisGlobal[2]+chassis[0][2]-.09,0,0,0]
  // var upperAGlobal = [chassisGlobal[0]+chassis[2][0],chassisGlobal[1]+chassis[2][1],chassisGlobal[2]+chassis[2][2]+.09,0.05,0,0]
  // var uprightGlobal = [lowerAGlobal[0]+.15,lowerAGlobal[1]+.4,lowerAGlobal[2]-.09,.25,0,0]

  const globals = {}
  globals.chassisGlobal = [myConfig.chassis[0][0],myConfig.chassis[0][1],myConfig.chassis[0][2],0,0,0]
  const vertOffset = (myConfig.chassis[2][2]-myConfig.chassis[0][2])/2.0
  globals.lowerAGlobal = [globals.chassisGlobal[0]+myConfig.chassis[0][0],globals.chassisGlobal[1]+myConfig.chassis[0][1],globals.chassisGlobal[2]+myConfig.chassis[0][2]-vertOffset,0,0,0]
  //use rise/run here of difference between upright height and chassis height, and run from a arm length.
  upperA_angle_approx = math.atan(((myConfig.upright[1][2]-myConfig.upright[0][2]) - (myConfig.chassis[2][2]-myConfig.chassis[0][2]))/myConfig.upperA[2][1])
  globals.upperAGlobal = [globals.chassisGlobal[0]+myConfig.chassis[2][0],globals.chassisGlobal[1]+myConfig.chassis[2][1],globals.chassisGlobal[2]+myConfig.chassis[2][2]+vertOffset,upperA_angle_approx,0,0]
  //use rise/run again.
  kingpin_angle_approx =0// math.atan( (myConfig.lowerA[2][1]-myConfig.upperA[2][1])/(myConfig.upright[1][2]-myConfig.upright[0][2])   )
  print("approx new kingpin: "+str(kingpin_angle_approx))
  print("approx upper a-arm: "+str(upperA_angle_approx))
  globals.uprightGlobal = [globals.lowerAGlobal[0]+myConfig.lowerA[1][0]/2.0,globals.lowerAGlobal[1]+myConfig.lowerA[2][1],globals.lowerAGlobal[2]-vertOffset,kingpin_angle_approx,0,0] //angle guess was .25


  return globals
}


///// VARIABLES FOR PLOTTING AND DATA COLLECTION
var suspPlot;
var globalXData = [];
var globalYData = [];
var globalCurrentX = [];
var globalCurrentY = [];
var input_min = 0;
var input_max = 0;
var input_increment = 0;
var simlength = 0;
// var simdata = '';
// var chartdata = new Object();
// var chartdata ={};


//////// VARIABLE TO LOCK OUT USER INPUT
var simulating = false;



function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};


function savePlotData(){

  var simdata = ''

  for(let k=0;k<globalYData.length;k++){
    simdata+=str(globalXData[k])+"\t"+str(globalYData[k])+"\r\n"
  }

  var blob;
  if (typeof window.Blob == "function") {
    blob = new Blob([simdata], {
      type: "text/latex"
    });
  } else {
    var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
    var bb = new BlobBuilder();
    bb.append(simdata);
    blob = bb.getBlob(simdata);
  }
  var URL = window.URL || window.webkitURL;
  var bloburl = URL.createObjectURL(blob);
  var anchor = document.createElement("a");
  if ('download' in anchor) {
    anchor.style.visibility = "hidden";
    anchor.href = bloburl;
    anchor.download = document.getElementById("plotfilename").value+".txt";
    document.body.appendChild(anchor);
    var evt = document.createEvent("MouseEvents");
    evt.initEvent("click", true, true);
    anchor.dispatchEvent(evt);
    document.body.removeChild(anchor);
  } else if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, "SimData.txt");
  } else {
    location.href = bloburl;
  }


}


//call this plot when options have changed.
function generateNewPlot(){
  //get y axis and x axis from dropdown. Use if statements to generate data and labels
  globalYData = [];
  globalXData = [];
  input_min = float(document.getElementById("input_min").value);
  input_max = float(document.getElementById("input_max").value);
  input_increment = float(document.getElementById("input_inc").value);
  simlength = int((input_max-input_min)/input_increment);
  print("Sim Length: "+str(simlength))
  globalXData.push(input_min);
  susp.solve();
  simulating = true;

}



/////// this function puts data in the format required by chartJS.
/////// you can update the chart's data with the result of this function, then call chart.update()
function generateData(xdata,ydata) {
            var data = [];
            for (var i = 0; i < ydata.length; i++) {
                data.push({
                    x: xdata[i],
                    y: ydata[i]
                });
            }
            return data;
        }


/////////////// PLOT PLOTTING plot plotting make chart
function initLineChart(data, myTitle, xlabel, ylabel) {
        canv = document.getElementById("chartCanvas");
        var config = {  // Chart.js configuration, including the DATASETS data from the model data
          type: "scatter",
          title: myTitle,
          
          data: {
        datasets: [{
            // xAxisID: "Time (s)",
            // yAxisID: "Output",
            pointBackgroundColor: 'rgba(0, 0, 0, 1)',
            showLine: true,
            borderColor: 'rgba(0, 0, 0, 1)',
            fill: false,
            label: '',
            data: data
        }]
    },
          options: {
            maintainAspectRatio: false,
          responsive: true,
             scales: {
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: (ylabel),
              }
            }],
             xAxes: [{
              scaleLabel: {
                display: true,
                labelString: (xlabel),
              }
            }]
        },
             title: {
            display: true,
            text: myTitle
        }
          }
        };

        suspPlot = new Chart(canv, config);

        return canv;
      }





function varcopy(x) {
    return JSON.parse( JSON.stringify(x) );
}

////callback for the "solve once" button
function solveSuspension(){
  susp.update()
  // susp.solveRough()
  // susp.draw()
}


function Suspension(lowerA,upperA,upright,chassis,tierodlength){
  //local coordinate representations of each link
  this.lowerA = lowerA
  this.upperA = upperA
  this.upright = upright
  this.chassis = chassis
  this.tierodlength = tierodlength

  //now create global coordinates for each body
  //format [X,Y,Z,r,p,y] for each body
  var chassisGlobal= [0,0,0,0,0,0]
  var lowerAGlobal = [chassisGlobal[0]+chassis[0][0],chassisGlobal[1]+chassis[0][1],chassisGlobal[2]+chassis[0][2]-.09,0,0,0]
  var upperAGlobal = [chassisGlobal[0]+chassis[2][0],chassisGlobal[1]+chassis[2][1],chassisGlobal[2]+chassis[2][2]+.09,0.05,0,0]
  var uprightGlobal = [lowerAGlobal[0]+.15,lowerAGlobal[1]+.4,lowerAGlobal[2]-.09,.25,0,0]



  //print(lowerAGlobal)
  this.lowerAGlobal = lowerAGlobal
  this.upperAGlobal = upperAGlobal
  this.chassisGlobal= chassisGlobal
  this.uprightGlobal = uprightGlobal

  //display-level variables
  this.fbscale = 2*windowWidth //adjust this for drawing
  this.ox = 200 //adjust this for drawing
  this.oy = 100 //adjust this for drawing
  this.oz = -300 //adjust this for drawing
  this.debug = true
  
  //guesses for q, our dependent gen coords
  //this.q = [this.lowerAglobal[3],this.lowerAGlobal[4],this.lowerAGlobal[5],this.upperAGlobal[3],this.upperAGlobal[4],this.upperAGlobal[5],this.uprightGlobal[3],this.uprightGlobal[4],this.uprightGlobal[5],this.uprightGlobal[0],this.uprightGlobal[1]]
  //constraint values
  this.eps = .001 //this is the perturbation size
  this.resid_thresh = .0005
  this.iter_limit = 100
  this.itercount = 0
  

  this.getqArrayFromGlobals = function(){
    // print(this.lowerAGlobal)
    var q = [this.lowerAGlobal[3],this.lowerAGlobal[4],this.lowerAGlobal[5],this.upperAGlobal[3],this.upperAGlobal[4],this.upperAGlobal[5],this.uprightGlobal[3],this.uprightGlobal[4],this.uprightGlobal[5],this.uprightGlobal[0],this.uprightGlobal[1]]
    return q
  }

  this.updateGlobalPositionsFromQ = function(q){
    //q are: [lAr lAp lAa uAr uAp uAa ur up ua ux uy]
    this.lowerAGlobal = [this.lowerAGlobal[0],this.lowerAGlobal[1],this.lowerAGlobal[2],q[0],q[1],q[2]]
    this.upperAGlobal = [this.upperAGlobal[0],this.upperAGlobal[1],this.upperAGlobal[2],q[3],q[4],q[5]]
    this.uprightGlobal = [q[9],q[10],this.uprightGlobal[2],q[6],q[7],q[8]]
  }



  //https://www.johndcook.com/blog/2018/05/05/svd/ <-use SVD to get Moore-Penrose.
  this.shultzInverse = function(M){
    iM = math.eye(M._size[1])
    for(let k=0;k<10;k++){
      iM = math.multiply(iM,math.subtract(math.multiply(math.eye(M._size[0]),2),math.multiply(M,iM))) 
    }
    return iM
  }

  //makes a rotation matrix
  // http://web.mit.edu/2.05/www/Handout/HO2.PDF
  this.makeRotation = function(roll, pitch, yaw){
    const R = math.matrix([[cos(yaw)*cos(pitch), cos(yaw)*sin(pitch)*sin(roll)-sin(yaw)*cos(roll),cos(yaw)*sin(pitch)*cos(roll)+sin(yaw)*sin(roll)],[sin(yaw)*cos(pitch), sin(yaw)*sin(pitch)*sin(roll)+cos(yaw)*cos(roll), sin(yaw)*sin(pitch)*cos(roll)-cos(yaw)*sin(roll)],[-sin(pitch),cos(pitch)*sin(roll), cos(pitch)*cos(roll)]])
    return R
  }

  //this function calculates global position given local. global origin in form [xyzrpa]
  this.calcGlobal = function(origin, qlocal){
    pglobal = []
    //create tall vector for rotation operation
    localvec = math.matrix([[qlocal[0]],[qlocal[1]],[qlocal[2]]])
    // if(this.debug){print("localvec: "+str(localvec))}
    //create rotation matrix
    R = this.makeRotation(origin[3],origin[4],origin[5])
    // if(this.debug){print("roll: "+str(origin[3])+", pitch: "+str(origin[4])+", yaw:"+str(origin[5]))}
    // if(this.debug){print("R: "+str(R))}
    //rotate point
    rotvec = math.multiply(R,localvec)
    // if(this.debug){print("localvec: "+str(rotvec))}
    //create plain array with translation by body origin
    pglobal = [origin[0]+rotvec.subset(math.index(0,0)),origin[1]+rotvec.subset(math.index(1,0)),origin[2]+rotvec.subset(math.index(2,0))]

    //return global position of point
    return pglobal
  }

  //loops through an array of 3-arrays, converting local coordinates into global coordinates of each point.
  this.getDrawPoints = function(origin,plocal){
    var pglobal = [];
    for(let k = 0;k<plocal.length;k++){
      //pull out this local xyz array
      thislocal = plocal[k]
      //now pass into the local to global function
      thisglobal = this.calcGlobal(origin,plocal[k])
      pglobal.push(thisglobal)
    }
    return pglobal
  }



  //constraint in X direction
  this.calcConstraints = function(q){
    // actual physical constraints are:
    // spherical chassis p1 to lower A p1
    // sperical chassis p2 to lower A p2
    // spherical chassis p3 to upper A p1
    // spherical chassis p4 to upper A p2
    // spherical lower A p3 to upright p1
    // spherical upper A p3 to upright p2
    // distance  upright p3 to chassis p5

    //idea to try: make 13 gen coords (just include dummy gen coords for tie rod loc?)

  

    //q are: [lAr lAp lAa uAr uAp uAa ur up ua ux uy]
    //known coords: lAx,lAy,lAz, uAx, uAy, uAz ()
    // write 3 eqn for fwd spherical lA spherical 1
    // write 3 eqn for fwd spherical uA spherical 2
    // write 3 eqn for upper A to upright UBJ spherical 3
    // write 1 eqn for lower A to upright sperical (z direction)
    // write 1 eqn for distance constraint for u-C (using tie rod length)
    // this means I have 9 constraint equations and 9 gen coords

    //using the current q, get local origin (global) variables for each link
    //this allows us to use the nice functions we have to calculate constraints using a 'local' q
    //which is required for calculating numerical Jacobian, for example
    lowerAGlobal = [this.lowerAGlobal[0], this.lowerAGlobal[1], this.lowerAGlobal[2], q[0],q[1],q[2]]
    upperAGlobal = [this.upperAGlobal[0], this.upperAGlobal[1], this.upperAGlobal[2], q[3],q[4],q[5]]
    //we are assuming LBJ's z position is fixed (known) here.
    uprightGlobal = [q[9],q[10],this.uprightGlobal[2],q[6],q[7],q[8]]

    //calculate phi1-phi3 (sph1)
    //global position of LA fwd spherical (sph1)
    sph1_laglobal = this.calcGlobal(lowerAGlobal,this.lowerA[1])
    sph1_chassisglobal = this.calcGlobal(this.chassisGlobal,this.chassis[1])
    //actually write the three constraint eqns for this spherical
    phi1 = sph1_laglobal[0] - sph1_chassisglobal[0]
    phi2 = sph1_laglobal[1] - sph1_chassisglobal[1]
    phi3 = sph1_laglobal[2] - sph1_chassisglobal[2]

    //calculate phi4-phi6 (sph2)
    //global position of UA fwd spherical (sph2)
    sph2_uaglobal = this.calcGlobal(upperAGlobal,this.upperA[1])
    sph2_chassisglobal = this.calcGlobal(this.chassisGlobal,this.chassis[3])
    //actually write the three constraint eqns for this spherical
    phi4 = sph2_uaglobal[0] - sph2_chassisglobal[0]
    phi5 = sph2_uaglobal[1] - sph2_chassisglobal[1]
    phi6 = sph2_uaglobal[2] - sph2_chassisglobal[2]

    //calculate phi7-phi9 (sph3)
    //global position of UA UBJ to Upright UBJ (sph3)
    sph3_uaglobal = this.calcGlobal(upperAGlobal,this.upperA[2])
    sph3_uprightglobal = this.calcGlobal(uprightGlobal,this.upright[1])
    //actually write the three constraint eqns for this spherical
    phi7 = sph3_uaglobal[0] - sph3_uprightglobal[0]
    phi8 = sph3_uaglobal[1] - sph3_uprightglobal[1]
    phi9 = sph3_uaglobal[2] - sph3_uprightglobal[2]

    //calculate partial spherical (sph4) for LBJ connection between LA and Upright
    sph4_laglobal = this.calcGlobal(lowerAGlobal,this.lowerA[2])
    sph4_uprightglobal = this.calcGlobal(uprightGlobal,this.upright[0])
    //actually write the z constraint eqn for this spherical
    // print("LBJ z: "+str(sph4_laglobal[2]))
    phi10 = sph4_laglobal[0] - sph4_uprightglobal[0]
    phi11 = sph4_laglobal[1] - sph4_uprightglobal[1]
    phi12 = sph4_laglobal[2] - sph4_uprightglobal[2]
    
    //calculate distance (double spherical) D1
    //this constraint tells us that the distance between LBJ and UBJ (between )
    d_ua = this.calcGlobal(uprightGlobal,this.upright[2])
    d_chassis = this.calcGlobal(this.chassisGlobal,this.chassis[4])
    phi13 = (math.pow(d_ua[0]-d_chassis[0],2)+math.pow(d_ua[1]-d_chassis[1],2)+math.pow(d_ua[2]-d_chassis[2],2)) - math.pow(this.tierodlength,2)


    // //calculate dot product between upright X and global X to keep it from flipping wildly.
    // uprightAxisGlobal = this.calcGlobal([0,0,0,this.uprightGlobal[3],this.uprightGlobal[4],this.uprightGlobal[5]],[1,0,0])
    // phi14 = uprightAxisGlobal[0] - 1

    constraints = math.matrix([[phi1],[phi2],[phi3],[phi4],[phi5],[phi6],[phi7],[phi8],[phi9],[phi10],[phi11],[phi12],[phi13]])

    // var fx = this.r2*cos(this.t2)+this.r3*cos(math.subset(q,math.index(0,0))) - this.r4*cos(math.subset(q,math.index(1,0))) - this.r1*cos(this.t1)
    // var fy = this.r2*sin(this.t2)+this.r3*sin(math.subset(q,math.index(0,0))) - this.r4*sin(math.subset(q,math.index(1,0))) - this.r1*sin(this.t1)
    // var constraints = math.matrix([[fx],[fy]])
    // print(str(constraints))
    return constraints
  }
  
  //calculates numerical jacobian
  this.calcJac = function(){
    //create a matrix to hold the jacobian
    const nconst = 13
    const ncoords = 11
    Jac = math.zeros(nconst,ncoords)
    //now perturb each gen coord 1 by 1
      for (let j = 0; j < ncoords; j++) {
        //go to current best guess of gen coords, make a local copy
        // qlocal = varcopy(this.q
        qlocal = varcopy(this.q)//perturb one of the coords in the local copy
        qlocal[j]+=this.eps 
        //evaluate the constraints based on perturbed q
        constraints_local = this.calcConstraints(qlocal)
        //now set the jacobian's column to the following.
        //this should be Jac(:,j) = (const_local - const)/eps
        jac_column = math.multiply((math.subtract(constraints_local,this.constraints)),1.0/this.eps)
        // print("Jac Column: "+str(jac_column))
        Jac = math.subset(Jac,math.index([0,1,2,3,4,5,6,7,8,9,10,11,12],j),jac_column)
        // for(let i = 0;i<nconst;i++){
        //   math.subset(Jac,math.index(j,i), jac_column[i]
        // }
      }
  return Jac
}

this.iterate = function(){
  //this.getqArrayFromGlobals()
  Jac = this.calcJac()

  //TRY using the SVD to compute a pseudoinverse.
  svdjac = svd(Jac._data)
  var Svec= svdjac.S
  var Svecp = []
  for(let k = 0;k<Svec.length;k++){
    if(Svec[k]!=0){
      Svecp.push(1.0/Svec[k])
    }
    else{
      Svecp.push(0)
    }
  }
  var Sp=math.transpose(math.diag(Svecp))
  var U=math.matrix(svdjac.U)
  var V=math.matrix(svdjac.V)

  var pIjac = math.multiply(V,math.multiply(Sp,math.transpose(U)))
  // var testinv = math.multiply(pIjac,Jac)


  ////end attempt at pseudoinverse
  // if(this.debug){print("PI test: "+str(testinv))}
  // if(this.debug){print("SVD: "+str(svdjac.D))}
  // if(this.debug){print("Jac: "+str(Jac))}
  this.constraints = this.calcConstraints(this.q)
  //print(str(this.constraints))
  //actually apply NR algorithm q+ = q - inv(Jac)*constraints
  qvec = math.transpose(math.matrix([this.q]))
  // newqvec = math.subtract(qvec,math.multiply(math.inv(Jac),this.constraints))
  newqvec = math.subtract(qvec,math.multiply(pIjac ,this.constraints))
  //now put this.q back into array form. flatten, then strip out data.
  newqvec_flattened = math.flatten(newqvec)
  this.q = newqvec_flattened._data
  this.updateGlobalPositionsFromQ(this.q)
}

this.solveRough = function(){
  var residthresh_save = this.resid_thresh
  this.resid_thresh = residthresh_save*2
  this.solve()
  this.resid_thresh = residthresh_save
}

this.solve = function(){

  //update the A-arm global positions that aren't in q.
  lA_rearglobal = this.calcGlobal(this.chassisGlobal,this.chassis[0])
  uA_rearglobal = this.calcGlobal(this.chassisGlobal,this.chassis[2])

  this.lowerAGlobal[0] = lA_rearglobal[0]
  this.lowerAGlobal[1] = lA_rearglobal[1]
  this.lowerAGlobal[2] = lA_rearglobal[2]
  this.upperAGlobal[0] = uA_rearglobal[0]
  this.upperAGlobal[1] = uA_rearglobal[1]
  this.upperAGlobal[2] = uA_rearglobal[2]
  // print("LA and RA: "+str(this.lowerAGlobal).slice(0,3)+"\t,\t"+str(this.upperAGlobal).slice(0,3))
  // print("should be: "+str(lA_rearglobal)+"\r:\t"+str(uA_rearglobal))
  //calculate initial value of constraints
  this.q = this.getqArrayFromGlobals()
  if(this.itercount<this.iter_limit){
  qsave = varcopy(this.q)
  // print("saved configuration: "+str(qsave))
}
  this.constraints = this.calcConstraints(this.q)

  // if((this.itercount<25)){
  //   useIter = this.resid_thresh/2.0
  // }
  // else{
  //   useIter = this.resid_thresh*2.0
  // }
  useIter = this.resid_thresh

  //iterate while error is large
  niter = 0
  //print((math.max(math.abs(this.constraints))))

  while((math.max(math.abs(this.constraints))>useIter)&&(niter<this.iter_limit)){
    //if(this.debug){print("q: "+str(math.multiply(this.q,180/3.14)))}
    niter+=1
    // print("Iteration: "+str(niter))
    //print(niter,this.constraints)
    this.iterate()

  }

  this.itercount = niter

  if(this.itercount>=this.iter_limit){
    print("iteration limit reached! norm is: "+str(math.max(this.constraints)))
    this.q = varcopy(qsave)
    this.updateGlobalPositionsFromQ(this.q)
    document.getElementById("sim_msg").innerHTML="Iteration Limit Reached! <br> What you're asking for is impossible <br> Press Reload Config to reset."
  }
  else{
    document.getElementById("sim_msg").innerHTML="Simulation health OK <br> Max solver error: "+parseFloat(math.max(this.constraints)).toPrecision(2)

  }

  // if(this.debug){
  //   print("FINAL : "+str(this.t3*180/PI)+","+str(this.t4*180/PI))
  // }
}

this.update = function(){
  //update independent driving variable
  this.q = this.getqArrayFromGlobals();
  this.solve();
  
  //debug
  // this.q = this.getqArrayFromGlobals()
  // this.constraints = this.calcConstraints(this.q)
  // print(str(this.constraints))

  //draw the system
  //this.getqArrayFromGlobals()
  this.draw()


}


//this function calls all of the relevant draw functions for individual components.
this.draw = function(){
  
  //make coordinate system match ours
  translate(this.ox,this.oy,this.oz)
  push()
  // rotateX(PI/2)
  // rotateZ(3*PI/2)
  rotateY(PI/2)
  rotateX(3*PI/2)

  //draw origin
  strokeWeight(10);
  stroke(color(255,0,0))
  // sphere(.01)
  line(0,0,0,100,0,0)
  push()
  translate(100,0,0)
  fill(color(255,0,0))
  stroke(255)
  textSize(100)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("X",0,-100)
  pop()


  stroke(color(0,255,0))
  // sphere(.01)
  line(0,0,0,0,100,0)
  push()
  translate(0,100,0)
  fill(color(0,255,0))
  stroke(255)
  textSize(100)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("Y",0,-100)
  pop()


  stroke(color(0,0,255))
  // sphere(.01)
  line(0,0,0,0,0,-100)
  push()
  translate(0,0,-100)
  fill(color(0,0,255))
  stroke(255)
  textSize(100)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("Z",0,-100)
  pop()


  pop()


  //reset to black
  stroke(255)

  push()
  //rotate so X forward and Y left. NOTE WEBGL is left handed. Need to negate z vals.
  rotateY(PI/2)
  rotateX(3*PI/2)
  scale(this.fbscale)
  strokeWeight(10);
  //draw each component
  this.drawLowerA();
  this.drawUpperA();
  this.drawUpright();
  this.drawChassis();
  this.drawTieRod();

  pop()
}

this.drawLowerA = function(){
  //print(this.lowerAGlobal[0])
  //get global drawing points
  points = this.getDrawPoints(this.lowerAGlobal,this.lowerA)
  // UBJ = this.calcGlobal(this.lowerAGlobal,this.upright[2])
  // if(this.debug){print("global lower A points: "+str(points))}
  // if(this.debug){print(UBJ)}
  //draw rear part of A-arm from p1 to p3
  line(points[0][0],points[0][1],-points[0][2],points[2][0],points[2][1],-points[2][2])
  //draw rear part of A-arm from p1 to p3
  line(points[1][0],points[1][1],-points[1][2],points[2][0],points[2][1],-points[2][2])
  for(let k = 0;k<3;k++){
    push()
    translate(points[k][0],points[k][1],-points[k][2])
    sphere(0.005)
    pop()
  }
}

this.drawUpperA = function(){
  //get global drawing points
  points = this.getDrawPoints(this.upperAGlobal,this.upperA)
  //draw rear part of A-arm from p1 to p3
  line(points[0][0],points[0][1],-points[0][2],points[2][0],points[2][1],-points[2][2])
  //draw rear part of A-arm from p1 to p3
  line(points[1][0],points[1][1],-points[1][2],points[2][0],points[2][1],-points[2][2])
  //draw spheres at each point. Make small
  for(let k = 0;k<3;k++){
    push()
    translate(points[k][0],points[k][1],-points[k][2])
    sphere(0.005)
    pop()
  }
}

this.drawUpright = function(){
  //get global drawing points
  points = this.getDrawPoints(this.uprightGlobal,this.upright)
  push()
  translate(this.uprightGlobal[0],this.uprightGlobal[1],-this.uprightGlobal[2])
  rotateZ((this.uprightGlobal[5]+this.upright[4][2]))
  rotateY(-(this.uprightGlobal[4]+this.upright[4][1]))
  rotateX(-(this.uprightGlobal[3]+this.upright[4][0]))
  //draw origin
  strokeWeight(10);
  stroke(color(255,0,0))
  // sphere(.01)
  line(0,0,0,.05,0,0)
  textFont(inconsolata)
  push()
  translate(.05,0,0)
  fill(color(255,0,0))
  stroke(255)
  textSize(0.025)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("X",0,-0.03)
  pop()
  stroke(color(0,255,0))
  // sphere(.01)
  line(0,0,0,0,.05,0)
  push()
  translate(0,.05,0)
  fill(color(0,255,0))
  stroke(255)
  textSize(0.025)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("Y",0,-0.03)
  pop()


  stroke(color(0,0,255))
  // sphere(.01)
  line(0,0,0,0,0,-.05)
  push()
  translate(0,0,-.05)
  fill(color(0,0,255))
  stroke(255)
  textSize(0.025)
  rotateZ(PI/2)
  rotateX(PI/2)
  rotateY(PI)
  text("Z",0,-0.03)
  pop()

  pop()
  
  //draw kingpin axis
  line(points[0][0],points[0][1],-points[0][2],points[1][0],points[1][1],-points[1][2])
  //draw line from upper BJ to tie rod
  line(points[0][0],points[0][1],-points[0][2],points[2][0],points[2][1],-points[2][2])
  //draw line from lower BJ to tie rod
  line(points[1][0],points[1][1],-points[1][2],points[2][0],points[2][1],-points[2][2])

  texts = ["urlbj","urubj","urtr","urwc"]
  for(let k = 0;k<4;k++){
    push()
    translate(points[k][0],points[k][1],-points[k][2])
    sphere(0.005)
        
    textFont(inconsolata)
    fill(color(255,255,0))
    stroke(255)
    textSize(0.025)
    rotateZ(PI/2)
    rotateX(PI/2)
    rotateY(PI)
    text(texts[k],0,-0.03)


    pop()
  }


  push()
  //now draw the wheel:
  translate(this.uprightGlobal[0],this.uprightGlobal[1],-this.uprightGlobal[2])
  //z rotation may need to be negated...
  rotateZ((this.uprightGlobal[5]+this.upright[4][2]))
  rotateY(-(this.uprightGlobal[4]+this.upright[4][1]))
  rotateX(-(this.uprightGlobal[3]+this.upright[4][0]))
  // rotateZ(this.uprightGlobal[0])
  // rotateY(this.uprightGlobal[1])
  // rotateX(this.uprightGlobal[2])
  translate(this.upright[3][0],this.upright[3][1],-this.upright[3][2])

  noFill()
  // sphere(.01)
  strokeWeight(1)
  cylinder(.18,8*.0254)
  pop()
}

this.drawTieRod = function(){
  cpoints = this.getDrawPoints(this.chassisGlobal,this.chassis)
  upoints = this.getDrawPoints(this.uprightGlobal,this.upright)
  stroke(color(255,0,255))
  line(cpoints[4][0],cpoints[4][1],-cpoints[4][2],upoints[2][0],upoints[2][1],-upoints[2][2])

  
    push()
    translate(cpoints[4][0],cpoints[4][1],-cpoints[4][2])
    sphere(0.005)
    pop()
    push()
    stroke(color(255,0,255))
    translate(upoints[2][0],upoints[2][1],-upoints[2][2])
    sphere(0.005)
    
    pop()



}

this.drawChassis = function(){
  cpoints = this.getDrawPoints(this.chassisGlobal,this.chassis)
  chassis2 = varcopy(this.chassis)
  chassis2[0][1]=0
  chassis2[1][1]=0
  chassis2[2][1]=0
  chassis2[3][1]=0
  cpoints2 = this.getDrawPoints(this.chassisGlobal,chassis2)
  stroke(color(180,180,180))

  texts = ["lar","laf","uar","uaf","ctr"]
  for(let k=0;k<cpoints.length;k++){
    push()
    translate(cpoints[k][0],cpoints[k][1],-cpoints[k][2])
    sphere(0.004)
    textFont(inconsolata)
    fill(color(255,255,0))
    stroke(255)
    textSize(0.025)
    rotateZ(PI/2)
    rotateX(PI/2)
    rotateY(PI)
    text(texts[k],0,-0.03)

    pop()
  }
  //draw line from vehicle center to RLA
  line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints2[0][0],cpoints2[0][1],-cpoints2[0][2])
  line(cpoints[1][0],cpoints[1][1],-cpoints[1][2],cpoints2[1][0],cpoints2[1][1],-cpoints2[1][2])
  line(cpoints[2][0],cpoints[2][1],-cpoints[2][2],cpoints2[2][0],cpoints2[2][1],-cpoints2[2][2])
  line(cpoints[3][0],cpoints[3][1],-cpoints[3][2],cpoints2[3][0],cpoints2[3][1],-cpoints2[3][2])
  line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints[1][0],cpoints[1][1],-cpoints[1][2])
  line(cpoints[2][0],cpoints[2][1],-cpoints[2][2],cpoints[3][0],cpoints[3][1],-cpoints[3][2])
  line(cpoints[0][0],cpoints[0][1],-cpoints[0][2],cpoints[2][0],cpoints[2][1],-cpoints[2][2])
  line(cpoints[1][0],cpoints[1][1],-cpoints[1][2],cpoints[3][0],cpoints[3][1],-cpoints[3][2])
}

}



//following taken from: https://github.com/sloisel/numeric/blob/master/src/svd.js
svd= function svd(A) {
      var temp;
  //Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
    var prec= Math.pow(2,-52) // assumes double prec
    var tolerance= 1.e-64/prec;
    var itmax= 50;
    var c=0;
    var i=0;
    var j=0;
    var k=0;
    var l=0;
    
    var u= varcopy(A);
    var m= u.length;
    
    var n= u[0].length;
    
    if (m < n) throw "Need more rows than columns"
    
    var e = new Array(n);
    var q = new Array(n);
    for (i=0; i<n; i++) e[i] = q[i] = 0.0;
    var v = rep([n,n],0);
  //  v.zero();
    
    function pythag(a,b)
    {
      a = Math.abs(a)
      b = Math.abs(b)
      if (a > b)
        return a*Math.sqrt(1.0+(b*b/a/a))
      else if (b == 0.0) 
        return a
      return b*Math.sqrt(1.0+(a*a/b/b))
    }

    //Householder's reduction to bidiagonal form

    var f= 0.0;
    var g= 0.0;
    var h= 0.0;
    var x= 0.0;
    var y= 0.0;
    var z= 0.0;
    var s= 0.0;
    
    for (i=0; i < n; i++)
    { 
      e[i]= g;
      s= 0.0;
      l= i+1;
      for (j=i; j < m; j++) 
        s += (u[j][i]*u[j][i]);
      if (s <= tolerance)
        g= 0.0;
      else
      { 
        f= u[i][i];
        g= Math.sqrt(s);
        if (f >= 0.0) g= -g;
        h= f*g-s
        u[i][i]=f-g;
        for (j=l; j < n; j++)
        {
          s= 0.0
          for (k=i; k < m; k++) 
            s += u[k][i]*u[k][j]
          f= s/h
          for (k=i; k < m; k++) 
            u[k][j]+=f*u[k][i]
        }
      }
      q[i]= g
      s= 0.0
      for (j=l; j < n; j++) 
        s= s + u[i][j]*u[i][j]
      if (s <= tolerance)
        g= 0.0
      else
      { 
        f= u[i][i+1]
        g= Math.sqrt(s)
        if (f >= 0.0) g= -g
        h= f*g - s
        u[i][i+1] = f-g;
        for (j=l; j < n; j++) e[j]= u[i][j]/h
        for (j=l; j < m; j++)
        { 
          s=0.0
          for (k=l; k < n; k++) 
            s += (u[j][k]*u[i][k])
          for (k=l; k < n; k++) 
            u[j][k]+=s*e[k]
        } 
      }
      y= Math.abs(q[i])+Math.abs(e[i])
      if (y>x) 
        x=y
    }
    
    // accumulation of right hand gtransformations
    for (i=n-1; i != -1; i+= -1)
    { 
      if (g != 0.0)
      {
        h= g*u[i][i+1]
        for (j=l; j < n; j++) 
          v[j][i]=u[i][j]/h
        for (j=l; j < n; j++)
        { 
          s=0.0
          for (k=l; k < n; k++) 
            s += u[i][k]*v[k][j]
          for (k=l; k < n; k++) 
            v[k][j]+=(s*v[k][i])
        } 
      }
      for (j=l; j < n; j++)
      {
        v[i][j] = 0;
        v[j][i] = 0;
      }
      v[i][i] = 1;
      g= e[i]
      l= i
    }
    
    // accumulation of left hand transformations
    for (i=n-1; i != -1; i+= -1)
    { 
      l= i+1
      g= q[i]
      for (j=l; j < n; j++) 
        u[i][j] = 0;
      if (g != 0.0)
      {
        h= u[i][i]*g
        for (j=l; j < n; j++)
        {
          s=0.0
          for (k=l; k < m; k++) s += u[k][i]*u[k][j];
          f= s/h
          for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
        }
        for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
      }
      else
        for (j=i; j < m; j++) u[j][i] = 0;
      u[i][i] += 1;
    }
    
    // diagonalization of the bidiagonal form
    prec= prec*x
    for (k=n-1; k != -1; k+= -1)
    {
      for (var iteration=0; iteration < itmax; iteration++)
      { // test f splitting
        var test_convergence = false
        for (l=k; l != -1; l+= -1)
        { 
          if (Math.abs(e[l]) <= prec)
          { test_convergence= true
            break 
          }
          if (Math.abs(q[l-1]) <= prec)
            break 
        }
        if (!test_convergence)
        { // cancellation of e[l] if l>0
          c= 0.0
          s= 1.0
          var l1= l-1
          for (i =l; i<k+1; i++)
          { 
            f= s*e[i]
            e[i]= c*e[i]
            if (Math.abs(f) <= prec)
              break
            g= q[i]
            h= pythag(f,g)
            q[i]= h
            c= g/h
            s= -f/h
            for (j=0; j < m; j++)
            { 
              y= u[j][l1]
              z= u[j][i]
              u[j][l1] =  y*c+(z*s)
              u[j][i] = -y*s+(z*c)
            } 
          } 
        }
        // test f convergence
        z= q[k]
        if (l== k)
        { //convergence
          if (z<0.0)
          { //q[k] is made non-negative
            q[k]= -z
            for (j=0; j < n; j++)
              v[j][k] = -v[j][k]
          }
          break  //break out of iteration loop and move on to next k value
        }
        if (iteration >= itmax-1)
          throw 'Error: no convergence.'
        // shift from bottom 2x2 minor
        x= q[l]
        y= q[k-1]
        g= e[k-1]
        h= e[k]
        f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
        g= pythag(f,1.0)
        if (f < 0.0)
          f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
        else
          f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
        // next QR transformation
        c= 1.0
        s= 1.0
        for (i=l+1; i< k+1; i++)
        { 
          g= e[i]
          y= q[i]
          h= s*g
          g= c*g
          z= pythag(f,h)
          e[i-1]= z
          c= f/z
          s= h/z
          f= x*c+g*s
          g= -x*s+g*c
          h= y*s
          y= y*c
          for (j=0; j < n; j++)
          { 
            x= v[j][i-1]
            z= v[j][i]
            v[j][i-1] = x*c+z*s
            v[j][i] = -x*s+z*c
          }
          z= pythag(f,h)
          q[i-1]= z
          c= f/z
          s= h/z
          f= c*g+s*y
          x= -s*g+c*y
          for (j=0; j < m; j++)
          {
            y= u[j][i-1]
            z= u[j][i]
            u[j][i-1] = y*c+z*s
            u[j][i] = -y*s+z*c
          }
        }
        e[l]= 0.0
        e[k]= f
        q[k]= x
      } 
    }
      
    //vt= transpose(v)
    //return (u,q,vt)
    for (i=0;i<q.length; i++) 
      if (q[i] < prec) q[i] = 0
      
    //sort eigenvalues  
    for (i=0; i< n; i++)
    {  
    //writeln(q)
     for (j=i-1; j >= 0; j--)
     {
      if (q[j] < q[i])
      {
    //  writeln(i,'-',j)
       c = q[j]
       q[j] = q[i]
       q[i] = c
       for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
       for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
  //     u.swapCols(i,j)
  //     v.swapCols(i,j)
       i = j     
      }
     }  
    }
    
    return {U:u,S:q,V:v}
};

rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = rep(s,v,k+1); }
    return ret;
}

