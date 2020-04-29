function round(number){return Math.round(number * 100) / 100;}

function rewards(){
	var states = nodes.map(function (node) { return node.name});
	//console.log('calculating rewards for ' + states.length + ' states');
	rsa_object = {}
	states.forEach(function(source){
		values = {}
		states.forEach(function(target){
			//console.log('calculating rewards for ' + source + ' --> ' + target);
			r = 0
			links.forEach(function (l) {
				//console.log('checking ' + l.source.name + '-->' + l.target.name);
				if (l.source.name == source & l.target.name == target){
					r = 1;
				}				
			});
      if (source == dest_node_name & target == dest_node_name){
					r = 1.1;
			}	
			Object.assign(values, {[target]:r});
			//console.log(values);
		});		
		Object.assign(rsa_object, {[source]: values})	
	});
	return rsa_object;
}

function initQ(){
	q_object = {}
	nodes.forEach(function(source){
		values = {}
		nodes.forEach(function(target){
				Object.assign(values, {[target.name]:0});
			//console.log(values);
		});		
		Object.assign(q_object, {[source.name]: values})	
	});
//	console.log(q_object);
	return q_object;
}

/*
prep_svg
*/
function prep_svg(){
  svg.remove();
  svg = d3.select("#mdp_graph").append("svg")
    .attr("width", width)
    .attr("height", height)
    // .call(d3.zoom().on("zoom", function () {
    //    svg.attr("transform", d3.event.transform)
    // }));

  svg.append("rect")
	  .attr("x", 0)
		.attr("y", 0)
  	.attr("width", width)
  	.attr("height", height)
  	.style("stroke", bordercolor)
  	.style("stroke-width", border)
  	.on("mousedown", mousedown);

  linesg = svg.append("g");
  circlesg = svg.append("g");
  circles_labels_g = svg.append("g");
  svg.append("svg:defs")
  .selectAll("marker")
  .data(["child"])
  .enter()
  .append("svg:marker")
  .attr("id", String)
  .attr("markerUnits", "userSpaceOnUse")
  .attr("viewBox", "0 -5 30 30")
  .attr("refX", link_distance / 1.6)
  .attr("refY", 5)
  //.attr("stroke","gray")
  .attr("markerWidth", 30)
  .attr("markerHeight", 30)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", 'M 0 0 40 5 0 12 8 6');//.attr('d', 'M 0,-5 L 10 ,0 L 0,5')//.attr("d", "M0,-5L10,0L0,5");
  //.attr("d", 'M 0 0 12 6 0 12 3 6');
  if (step_log){
    svg.append("foreignObject")
      .attr("width", "600px")
      .attr("height", "220px")
      .style("text-align","left")
      .style("opacity","0.7")
      //.style("border", "1px solid red")
      .append("xhtml:div")
      .html(function(d) { 
        return (step_desc);
      });
      step_log = false;
  }
}
console.log("loading script.js")
var width = 1200,
    height = 700,
     border=1,
     bordercolor='black',
    selected_node, selected_target_node,
    selected_link, new_line,
    circlesg, linesg,
    should_drag = false,
    drawing_line = false,
    nodes = [],
    links = [],
    border=1,
    bordercolor='black'
  	node_radius = 35
    link_distance = 370
    node_label_font_size = 40
    link_label_font_size = 20
  	link_marker_size = 50,
    table_font_size = 25,
    prev_node_count = 0,
  	prev_link_count = 0,
  	gamma = 0.9,
    alpha = 0.75,
    explore = 0.5,
    iterations = 100,
    step_desc = "",
    default_name = "S",
    dest_node_name="Sx",
    step_log = false;

d3.select(window)
	.on("mousemove", mousemove)
	.on("mouseup", mouseup)
	.on("keydown", keydown)
	.on("keyup", keyup);
console.log("window selected and mouse events registered")
var svg = d3.select("#mdp_graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .charge(-2000)
    .linkDistance(link_distance)
    .size([width, height]);

d3.select('#gamma_input').on("input", function() {gamma = (+this.value);});
d3.select('#alpha_input').on("input", function() {alpha = (+this.value);});
d3.select('#explore_input').on("input", function() {explore = (+this.value);});
d3.select('#iter_input').on("input", function() {iterations = (+this.value);});

    
/*
runQAlgo:
Caller: play-button
 */

d3.select("#play-button")
    .on("click", runQAlgo);
	
function runQAlgo() {
  var states = nodes.map(function (node) { return node.name});
	var available_actions = links.map(function (l) {return l.name})
  
	Q = initQ();
  R = rewards();
	for(i = 0 ; i < iterations ; i++){
		current_state = _.sample(states, 1);
    
		//console.log('iteration ' + i + ' state ' + current_state);
		if (_.random(0,1) > explore) 
		{ 	// Explore
			// desired_future_state = _.sample(links, 1)[0].target.name;
     // console.log(states)
      //states = states.filter(function(state_){return state_ != current_state;})
      desired_future_state = _.sample(states.filter(function(state_){return state_ != current_state;}), 1);
     // console.log(states)
      // desired_future_state = random_action.target.name
     // console.log('Exploring ' + random_action.name + ' to ' + desired_future_state)
    }
    else
		{ 	// Expoit
			qvals_of_future_states = Object.values(Q[current_state])
			//console.log(qvals_of_future_states);
			max_Q_Value_action_index = qvals_of_future_states.indexOf(Math.max(...qvals_of_future_states));
		//	console.log(max_Q_Value_action_index);
			desired_future_state = Object.keys(Q[current_state])[max_Q_Value_action_index];
    //  console.log('Exploiting ' + desired_future_state);
		}	 
    reward = R[current_state][desired_future_state];
    //console.log('reward ' + reward);
    qvals_of_actions_doable_at_future_state = Object.values(Q[desired_future_state])
    qval_for_desired_future_state = Math.max(...qvals_of_actions_doable_at_future_state);
    //console.log('Q Value for future state ' + qval_for_desired_future_state);
    //Quality of action for current_state
    qval_for_current_state = Q[current_state][desired_future_state];
    //console.log('Q Value for current state ' + qval_for_current_state);
    TD = reward + gamma * qval_for_desired_future_state - qval_for_current_state
    //console.log('TD = ' + TD)
    Q[current_state][desired_future_state] = Q[current_state][desired_future_state] + alpha * TD;
    //console.log(Q)
    //render_Q_table(Q);
    d3.select("#iter_count").html('Step: ' + (i+1));
    if (i + 1 == iterations){
      for(link_i =0 ; link_i < links.length ; link_i ++){
        s = links[link_i].source.name
        t = links[link_i].target.name
        links[link_i].Q = Q[s][t];
      }
    }
	}
  render_Q_table(Q);
  console.log('all done')
  prep_svg();
  update();
  console.log('all done....')
  stepQ = Q;
}
/*
runQAlgo_Onestep:
Caller: step-button
 */
var stepQ;
var stepR;
var step=0;
d3.select("#step-button")
    .on("click", function(){
      runQAlgo_Onestep();
    });

function runQAlgo_Onestep() {
  step_log = true;
  var states = nodes.map(function (node) { 
                                    node.is_source = false;
                                    node.is_target = false;
                                    return node.name
                                    });
	var available_actions = links.map(function (l) {
                                          l.is_active = false;
                                          return l.name;
                                          });
  update();
	current_state = _.sample(states, 1)[0];

//	console.log('step ' + step + ' state ' + current_state);
  step = step + 1;
 // console.log(links)
  exp = "Exploring."
	if (_.random(0, 1) > explore) 
	{ 	// Explore
  //  console.log('Explored');
    console.log(states)
    states = states.filter(function(state){return state != current_state;})
    console.log(states)
		desired_future_state = _.sample(states);//_.sample(links, 1)[0];
    //desired_future_state = best_action.target.name
    //console.log('Exploring ' + best_action.name + ' to ' + desired_future_state)
  }else
	{ 	// Expoit
    exp = "Exploited"
		qvals_of_future_states = Object.values(stepQ[current_state])
		//console.log(qvals_of_future_states);
		max_Q_Value_action_index = qvals_of_future_states.indexOf(Math.max(...qvals_of_future_states));
	//	console.log(max_Q_Value_action_index);
		desired_future_state = Object.keys(stepQ[current_state])[max_Q_Value_action_index];
    best_action = links.filter(function(l){l.source.name == current_state & l.target.name == desired_future_state})
   // console.log('Exploiting ' + best_action.name + ' to ' + desired_future_state);
	}	 
  // mark current_state, desired_future_state as active for rendering
  for (node_i = 0; node_i < nodes.length ; node_i ++){
      if ((nodes[node_i]).name == current_state) {(nodes[node_i]).is_source = true;} 
      if ((nodes[node_i]).name == desired_future_state) {(nodes[node_i]).is_target = true;}
  }
  //get reward for taking the action to go to desired_future_state from current_state
  reward = stepR[current_state][desired_future_state];
  //Quality of action for desired_future_state
  qvals_of_actions_doable_at_future_state = Object.values(stepQ[desired_future_state])
  qval_for_desired_future_state = Math.max(...qvals_of_actions_doable_at_future_state);
//  console.log('Q Value for future state ' + qval_for_desired_future_state);
  //Quality of action for current_state
  qval_for_current_state = stepQ[current_state][desired_future_state];
 // console.log('Q Value for current state ' + qval_for_current_state);
  //Temporal Difference: reward + (Discounted Quality of Action for going to desired_future_state) - (Quality of Action for current_state)
  TD = reward + (gamma * qval_for_desired_future_state) - qval_for_current_state
 // console.log('TD = ' + TD);
  stepQ[current_state][desired_future_state] = stepQ[current_state][desired_future_state] + alpha * TD;
 // console.log('stepQ[current_state][desired_future_state] ' + stepQ[current_state][desired_future_state])
  //links.filter(function(l){l.source.name == current_state & l.target.name == desired_future_state}).Q = stepQ[current_state][desired_future_state];
  for(link_i = 0 ; link_i < links.length ; link_i ++){
    if(links[link_i].source.name == current_state & links[link_i].target.name == desired_future_state){
        links[link_i].Q = stepQ[current_state][desired_future_state];
        links[link_i].is_active = true;
        break;
    }
  }
  // step_desc = "<tspan>Step: "+ step +"</tspan>" +
  //             "<br><tspan>Current State: "+ current_state +"</tspan>" +
  //             "<br><tspan>Desired Future State: "+ desired_future_state +"</tspan>";
  current_state_html = "<b><span style='color:green'>" + current_state + "</b></span>";
  desired_future_state_html = "<b><span style='color:darkgreen'>" + desired_future_state  + "</b></span>";
  TD_html = "<b><span style='color:blue'>TD</b></span>";
  TD_val_html = "<b><span style='color:blue'>" +  round(TD) + "</b></span>";
  Q_sa_html = "<b><span style='color:red'>"  + round(qval_for_current_state) +"</b></span>";
  Q_spap_html = "<b><span style='color:red'>"  + round(qval_for_desired_future_state) +"</b></span>";
  reward_html = "<b><span style='color:green'>Reward</b></span>";
  reward_val_html = "<b><span style='color:green'>"+reward+"</b></span>";
  current_state.substring(1)
  A = "<b><span style='color:red'>A" + current_state.substring(1) + desired_future_state.substring(1) + "</b></span>";
  step_desc =  exp + " " + A + ": Agent moved from " + current_state_html + " to "+desired_future_state_html + 
              "<br>Received " + reward_html + ": " + reward_val_html +
              "<br>Before moving, the <b><span style='color:red'> Quality of " + A + "</b></span> was " + Q_sa_html +
              "<br><b><span style='color:red'>Max Quality</span></b> acheivable from " + desired_future_state_html + " is " + Q_spap_html +
              "<br>"+
              "<br>Temporal Differnce " + 
              "<br>" + TD_html +" = " + reward_html + " + (Discount Factor) x (<b><span style='color:red'>Max Quality</span></b> of " + desired_future_state_html + ") - (<b><span style='color:red'>Quality of "  + A +"</b></span>)" +
              "<br>"+  TD_html +" = " + reward_val_html + " + " + gamma + " x " + Q_spap_html + " - " + Q_sa_html + " = " + TD_val_html +
              "<br>"+
              "<br>Updated <b><span style='color:red'>Quality of "+ A + "</b></span> = "+ 
              "(<b><span style='color:red'>Quality of "  + A +"</b></span>) + (Learning Rate) x " +  TD_html + " = " +
              "<br>Updated <b><span style='color:red'>Quality of "+ A + " = " + Q_sa_html + " + (" + alpha + ") x " + TD_val_html + " = " 
              + "<b><span style='color:red'>" + round(stepQ[current_state][desired_future_state]) + "</b></span>" ;

//<span style="color: #ff0000">January 30, 2011</span>
  //console.log(links)
  render_Q_table(stepQ);
  //console.log('ok')
  prep_svg();
  update();
  d3.select("#iter_count").html('Step: ' + step);
}



 /*
 nodes_dropdown: Render the solution
 */   
var nodes_dropdown = d3.select("#solution")
                   //.insert("select", "svg")
                   .on("change",show_solution);
               
function show_solution(d, i){
  var selected_node = d3.select(this).property('value');
  next_best_state = "";
  var route = [selected_node]
  while (next_best_state != dest_node_name | route.length > nodes.length) {
    // console.log(selected_node);
    // console.log(stepQ);
    q_of_next_states = Object.values(stepQ[selected_node]);
    // console.log('q_of_next_states', q_of_next_states);
    index_of_best_q_next_state = q_of_next_states.indexOf(Math.max(...q_of_next_states));
    // console.log('index_of_best_q_next_state', index_of_best_q_next_state);
    Object.keys(stepQ[selected_node])[index_of_best_q_next_state]
    next_best_state = Object.keys(stepQ[selected_node])[index_of_best_q_next_state]
    //console.log(selected_node + '-->' + next_best_state);
    route.push(next_best_state)
    selected_node = next_best_state
 }
// console.log(route)
 links.map(function (l) {l.is_active = false;});
  
 for(node_i = i ; node_i < route.length - 1; node_i ++){
   current_state = route[node_i];
   desired_future_state = route[node_i + 1];
   for(link_i =0 ; link_i < links.length ; link_i ++){
      if(links[link_i].source.name == current_state & links[link_i].target.name == desired_future_state){
          links[link_i].is_active = true;
          break;
      }
    }
  }
  prep_svg();
  // update();
}

nodes = [{"name":dest_node_name,"group":1, "is_dest":true, "is_source":false, "is_target":false}];
links = [];
prep_svg();
force = force
  .nodes(nodes)
  .links(links);
  force.start();



// var size_updated = false;
function update() {
  var node = circlesg.selectAll(".node")
    .data(nodes, function(d) {return d.name;})
    .classed("selected", function(d) { return d === selected_node; })
    .classed("selected_target", function(d) { return d === selected_target_node; })
  
  var nodeg = node.enter()
    .append("g")
    .attr("class", "node").call(force.drag)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
	
  nodeg.append("circle")
    .attr("r", node_radius)
	  .style("stroke", "gray")
	  .style("fill", function(d, i){
  	  if (d.is_source) {return "green";}
      if (d.is_target) {return "darkgreen";}
  	  if (d.is_dest) return "red";
  	  return "white";
  	  })
	  .style("opacity", function(d){ if (d.is_target) return "0.9"
                                    else return "0.5";})
    .on("mousedown", node_mousedown)
    .on("mouseover", node_mouseover)
    .on("mouseout", node_mouseout);
  
  
  nodeg
    .append("svg:a")
    .attr("xlink:href", function (d) { return d.url || '#'; })
    .append("text")
      .attr("dx", function(d){ 
      return -node_radius + d.name.length*5} )
      .attr("dy", ".35em")
      .style("font-size", node_label_font_size+"px") 
      .text(function(d) {return d.name});
  
  nodeg.append("title")
    .text(d => d.name);
	
  node.exit().remove();
  
	var link = linesg.selectAll("line.link")
      .data(links)
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .classed("selected", function(d) { return d === selected_link; });
  
	var linkg = link.enter()
    .append("line")
    .style("stroke", function(l, i){
       if (l.is_active)
          return "green"
       return "gray"
    })
    .attr("class", "link")
    .attr("marker-end", "url(#child)")
    .on("mousedown", line_mousedown)
  
	link.exit().remove();
  
    var edgepaths = circles_labels_g.selectAll(".edgepath")
        .data(links);
		
			   
    var edgepaths_g = edgepaths.enter()
        .append('path')
		.attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
               'class':'edgepath',
               'fill-opacity':0,
               'stroke-opacity':0,
              // 'fill':'blue',
              // 'stroke':'red',
               'id':function(d,i) {return 'edgepath'+i}})
		.style("pointer-events", "none");
	

	var edgelabels = circles_labels_g.selectAll(".edgelabel")
        .data(links)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attr({'class':'edgelabel',
               'id':function(d,i){return 'edgelabel'+i},
               'dx':- (link_distance / 4),
               'dy':-5,
               'font-size':link_label_font_size,
			        // 'stroke':'red',
               'fill':'#ccc'})
        .attr('stroke', function(l, i){ if (l.is_active) 
                                          return "green" 
                                        else 
                                          return "red";
                                      });
  
	edgelabels.append('textPath')
        .attr('xlink:href',function(d,i) {return '#edgepath'+i})
        .style("pointer-events", "none")
		    .style("text-anchor", "middle")
		    .attr("startOffset", "50%")
        .text(function(d,i){
            return d.name + ', Q:' + round(d.Q) ;
            });
  
	if (nodes.length != prev_node_count | links.length != prev_link_count){
		prev_node_count = nodes.length;
		prev_link_count =  links.length;
    stepQ = initQ();
    stepR = rewards();
    //console.log(stepR);
		render_rewards_table(stepR);
		render_Q_table(stepQ);
	}
	
   force.on("tick", function(e) {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    
      	node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      	edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
                                                 //console.log( 'edge path ' + path);
                                                 return path;
      									});       

      	edgelabels.attr('transform',function(d,i){
      		if (d.target.x<d.source.x){
      			bbox = this.getBBox();
      			rx = bbox.x + (bbox.width / 8);
      			ry = bbox.y + (bbox.height / 8);
      			return 'rotate(180 '+rx+' '+ry+')';
      			}
      		else {
      			return 'rotate(0)';
      			}
      	});
  });
  nodes_dropdown.selectAll("option")
                    .data(nodes)
                    .enter().append("option")
                    .attr("value",function(d, i){return d.name;})
                    .text(function (d) {
                        return d.name; // capitalize 1st letter
                    });
}



// select target node for new node connection
function node_mouseover(d) {
  if (drawing_line && d !== selected_node) {
    // highlight and select target node
    selected_target_node = d;
  }
}

function node_mouseout(d) {
  if (drawing_line) {
    selected_target_node = null;
  }
}

// select node / start drag
function node_mousedown(d) {
  if (!drawing_line) {
    selected_node = d;
    selected_link = null;
  }
  if (!should_drag) {
    d3.event.stopPropagation();
    drawing_line = true;
  }
  d.fixed = true;
  force.stop()
  update();
}

// select line
function line_mousedown(d) {
  selected_link = d;
  selected_node = null;
  update();
}

// draw yellow "new connector" line
function mousemove() {
  if (drawing_line && !should_drag) {
    var m = d3.mouse(svg.node());
    var x = Math.max(0, Math.min(width, m[0]));
    var y = Math.max(0, Math.min(height, m[1]));
    // debounce - only start drawing line if it gets a bit big
    var dx = selected_node.x - x;
    var dy = selected_node.y - y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      // draw a line
      if (!new_line) {
        new_line = linesg.append("line").attr("class", "new_line");
      }
      new_line.attr("x1", function(d) { return selected_node.x; })
        .attr("y1", function(d) { return selected_node.y; })
        .attr("x2", function(d) { return x; })
        .attr("y2", function(d) { return y; });
    }
  }
  update();
}

// add a new disconnected node
function mousedown() {
  m = d3.mouse(svg.node())
  nodes.push({x: m[0], y: m[1], name: default_name + nodes.length, group: 1, is_dest:false, is_source:false, is_target:false});
  selected_link = null;
  force.stop();
  update();
  force.start();
}

// end node select / add new connected node
function mouseup() {
  drawing_line = false;
  if (new_line) {
    if (selected_target_node) {
      selected_target_node.fixed = false;
      var new_node = selected_target_node;
    } else {
      var m = d3.mouse(svg.node());
      var new_node = {x: m[0], y: m[1], name: default_name + nodes.length, group: 1}
      nodes.push(new_node);
    }
    selected_node.fixed = false;
    links.push({
      source: selected_node, 
      target: new_node, 
      name:"A" + selected_node.name.substring(1) + new_node.name.substring(1), 
      R:0, 
      Q:0, 
      is_active:false
      })
    selected_node = selected_target_node = null;
    update();
    setTimeout(function () {
      new_line.remove();
      new_line = null;
      force.start();
    }, 300);
  }
}

function keyup() {
  switch (d3.event.keyCode) {
    case 16: { // shift
      should_drag = false;
      update();
      force.start();
    }
  }
}

// select for dragging node with shift; delete node with backspace
function keydown() {
  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: { // delete
      if (selected_node) { // deal with nodes
        var i = nodes.indexOf(selected_node);
        nodes.splice(i, 1);
        // find links to/from this node, and delete them too
        var new_links = [];
        links.forEach(function(l) {
          if (l.source !== selected_node && l.target !== selected_node) {
            new_links.push(l);
          }
        });
        links = new_links;
        selected_node = nodes.length ? nodes[i > 0 ? i - 1 : 0] : null;
      } else if (selected_link) { // deal with links
        var i = links.indexOf(selected_link);
        links.splice(i, 1);
        selected_link = links.length ? links[i > 0 ? i - 1 : 0] : null;
      }
      prep_svg();
      update();
      forEach.start();
      break;
    }
    case 16: { // shift
      should_drag = true;
      break;
    }
  }
}

 /*
 models_dropdown: Select example
 */ 
//var examples = ["Create New", "Star", "8 States"];

var models_dropdown = d3.select("#example_models") 
                        .on("change",model_selection);     

// var models_dropdown = d3.select("#model_selection")
//                     .insert("select", "svg")
//                     .on("change",model_selection);
console.log("populating dropdown models") 
models_dropdown.selectAll("option")
              .data(["Create New", "4 States", "5 States", "7 States","8 States", "8 States+"])
              .enter().append("option")
              .attr("value",function(d, i){return d;})
              .text(function (d) {
                  return d; // capitalize 1st letter
              });
	
function model_selection(d, i){
  var selection = d3.select(this).property('value');
 // console.log(selection)
  nodes = [{"name":dest_node_name,"group":1, "is_dest":true, "is_source":false, "is_target":false}];
    links = [];
    prep_svg();
    //update();
    force = force
    .nodes(nodes)
    .links(links);
    force.start();
  if (selection == 'Create New')
  {
    // nodes = [{"name":dest_node_name,"group":1, "is_dest":true, "is_source":false, "is_target":false}];
    // links = [];
    // prep_svg();
    // //update();
    // force = force
    // .nodes(nodes)
    // .links(links);
    // force.start();
  }
  if (selection == '4 States'){
    svg.selectAll("*").remove();
    prep_svg();
    d3.json('https://raw.githubusercontent.com/DrUzair/MLSD/master/RL/data/4_States.json', 
    function(err, data){
      nodes = data[0];
      links = data[1];
    });
    // prep_svg();
  }
  if (selection == '5 States'){
    svg.selectAll("*").remove();
    prep_svg();
    d3.json('https://raw.githubusercontent.com/DrUzair/MLSD/master/RL/data/Star.json', 
    function(err, data){
      nodes = data[0];
      links = data[1];
    });
    // prep_svg();
  }
  if (selection == '7 States'){
    svg.selectAll("*").remove();
    prep_svg();
    d3.json('https://raw.githubusercontent.com/DrUzair/MLSD/master/RL/data/7%20States.json', 
    function(err, data){
      nodes = data[0];
      links = data[1];
    });
    // prep_svg();
  }
  if (selection == '8 States'){
    svg.selectAll("*").remove();
    prep_svg();
    d3.json('https://raw.githubusercontent.com/DrUzair/MLSD/master/RL/data/8_States.json', 
    function(err, data){
      nodes = data[0];
      links = data[1];
    });
    // prep_svg();
  }
  if (selection == '8 States+'){
    svg.selectAll("*").remove();
    prep_svg();
    d3.json('https://raw.githubusercontent.com/DrUzair/MLSD/master/RL/data/8_States_2.json', 
    function(err, data){
      nodes = data[0];
      links = data[1];
    });
    // prep_svg();
  }
}

 /*
 Rewards Table
 */ 
// var svg_reward_table = svg.append("foreignObject")
//       .attr("width", 480)
//       .attr("height", 500)
//       .append("xhtml:body")


function render_rewards_table(rewards_obj) {
	d3.select("#rsa_table").selectAll("*").remove();
	var rsa_table = d3.select("#rsa_table")
  .append("table")
  .style("font-size", table_font_size+"px")
  .style("text-align", "center")
  //rsa_table.style.overflowY = "scroll";
 // .style("overflow-y: visible;")
 // .style("overflow-x: visible;");
	var thead = rsa_table.append('thead')
	var	tbody = rsa_table.append('tbody');
	var columns = ['.'].concat(Object.keys(rewards_obj));
	// append the header row
	thead.append('tr')
	  .selectAll('th')
	  .data(columns).enter()
	  .append('th')
	    .text(function (column) { return column; });

	// create a row for each object in the data
	var rows = tbody.selectAll('tr')
	  .data(columns)
	  .enter()
	  .append('tr');
	//
	// create a cell in each row for each column
	rows.selectAll('td')
	    .data(function (row, row_i) { 
			return columns.map(function (column, i) {	
				if (column == '.')
					rsa_val = columns[row_i] //Object.keys(rewards_obj)[row_i]
				else{
					rsa_val = rewards_obj[column][columns[row_i]];
				}
				//console.log('td --> ' + column +':'+ rsa_val)
				return {column: column, value:rsa_val};
			});
		})
	  .enter()
	  .append('td')
	    .text(function (d) { return d.value; });
		//
  //return table;  
}

function render_Q_table(Q) {
	d3.select("#Q_table").selectAll("*").remove();
	var Q_table = d3.select("#Q_table").append("table")
  .style("font-size", table_font_size + "px")
  .style("text-align", "center");
	var thead = Q_table.append('thead')
	var	tbody = Q_table.append('tbody');
	var columns = ['.'].concat(Object.keys(Q));
	// append the header row
 
	thead.append('tr')
	  .selectAll('th')
	  .data(columns).enter()
	  .append('th')
    .attr("style", "background-color: lightcoral")
	  .text(function (column) { return column; });

	// create a row for each object in the data
	var rows = tbody.selectAll('tr')
	  .data(columns)
	  .enter()
	  .append('tr');
	// create a cell in each row for each column
	rows.selectAll('td')
	    .data(function (row, row_i) { 
			return columns.map(function (column, i) {	
				if (column == '.')
					q_val = columns[row_i]
				else{
					q_val = Q[column][columns[row_i]];
					if(typeof q_val == 'number')
						q_val = Math.round(q_val * 100) / 100;
				}
				return {column: column, value:q_val};
			});
		})
	  .enter()
	  .append('td')
	    .text(function (d) { return d.value; });

}

/*
function download(content, fileName, contentType) {
   const a = document.createElement("a");
   const file = new Blob([content], { type: contentType });
   a.href = URL.createObjectURL(file);
   a.
   = fileName;
   a.click();
}

d3.select("#download-button")
    .on("click", function(){
      download(JSON.stringify([nodes, links]), "data.json", "text/plain");
    });
*/
