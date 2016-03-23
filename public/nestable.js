angular.module("nestable",[])

.directive("angularNestable", function(){

	return {
		templateUrl: "/nestable.html",
		scope:{
			list:"=list",
			"customTemplate":"@",
		},
		link:linkFn
	};

	function linkFn(scope,element,attr){
		scope.maxHeight = 5;
		scope.preventDrag = 'prevent-drag';
		scope.recursiveTemplate = "/nestable.html";
		scope.node = {"children":scope.list};
		scope.node.coordinates = [];

		assignCoordinates();
		assignStates();
		scope.toggleState = toggleState;
		var draggedNode = undefined;
		var draggedElement = undefined;
		var rootElement = element;
		scope.offsetX = 0;
		scope.offsetY = 0;

		$('body').on('mouseleave', function(){if(draggedElement !== undefined)scope.$apply(dragStop);})
		rootElement.on('mousedown', function(event){if(!$(event.target).hasClass(scope.preventDrag))dragStart(event);});
		rootElement.on('mouseup', function(event){if(!$(event.target).hasClass(scope.preventDrag))dragStop(event);});
		rootElement.on('mousemove', function(event){if(!$(event.target).hasClass(scope.preventDrag))dragged(event);});

		function assignCoordinates(node){
			if(!node)
				node = scope.node;
			if(node.children === undefined || node.children.length === 0)
				node.state = "leaf";
			for(i in node.children){
				node.children[i].coordinates = node.coordinates.slice();
				node.children[i].coordinates.push(i);
				assignCoordinates(node.children[i]);
			}
		}

		function assignStates(node){
			if(!node)
				node = scope.node;
			if(node.children === undefined || node.children.length === 0)
				node.state = "leaf";
			else if(node.state === "leaf")
				node.state = "expanded";
			for(i in node.children){			
				if(node.children[i].state === undefined)
					node.children[i].state = "expanded";
				assignStates(node.children[i]);
			}
		}

		function dragStart($event){
			$event.stopPropagation();
			draggedElement = $($event.target).closest('li');
			var node = getNode(JSON.parse(draggedElement.attr('data-coordinates')));
			draggedNode = node;;
			draggedElement.css("position","relative");
			scope.offsetX = $event.pageX;
			scope.offsetY = $event.pageY;
		}

		function dragStop($event){
			$event.stopPropagation();
			if(!draggedElement || !draggedNode)
				return;
			var dropElement = getCoveringNode($event.pageX, $event.pageY);

			if(dropElement){
				var dropCoordinates = JSON.parse(dropElement.attr('data-coordinates'));
				var dropNode = getNode(dropCoordinates);
				var initialCoordinates = draggedNode.coordinates.slice();
				var i = initialCoordinates.pop();
				var initialNode = getNode(initialCoordinates);

				if(dropNode !== initialNode || i !==0){
					if(dropNode.coordinates.length + getHeight(draggedNode) <= scope.maxHeight){
						initialNode.children.splice(i, 1);
						if(dropNode.children === undefined)
							dropNode.children = [draggedNode];
						else
							dropNode.children.splice(0, 0, draggedNode);					
					
						assignCoordinates();
						assignStates();
						scope.$apply();
					}
					else
						console.log("maximum depth achievable is "+ scope.maxHeight);
				}
			}
			if(draggedElement)
				draggedElement.css({'position':'static','left':'0px','top':'0px'});
			draggedElement = undefined;
			draggedNode = undefined;
			scope.offsetX = 0;
			scope.offsetY = 0;
		}

		function dragged($event){
			$event.stopPropagation();
			if(!draggedElement)
				return;
			draggedElement.css({'left':$event.pageX - scope.offsetX,'top':$event.pageY - scope.offsetY});
		}

		function getNode(coordinates){
			var el = scope.node;
			for(i in coordinates)
				el = el.children[coordinates[i]];
			return el;
		}

		function getCoveringNode(x, y, parent){
			var children;
			if(!parent){
				parent = rootElement;
				children = parent.children('li');
			} else {
				children = parent.children('ol').children('li');				
			}

			var offset;
			for(i = 0;i < children.length; i++){
				var child = $(children[i]);
				offset = child.offset();
				if(child.attr('data-coordinates') !== draggedElement.attr('data-coordinates'))
					if(offset.left < x 
							&& offset.top < y 
							&& offset.left+child.outerWidth() > x 
							&& offset.top+child.outerHeight() > y)
						return getCoveringNode(x,y, child) || child;
			}
			return undefined;
		}

		function getHeight(node){
			if(node.children === undefined || node.children.length === 0)
				return 1;
			else{
				var result = 0, solution = 0;
				for(i in node.children){
					result = getHeight(node.children[i]);
					if(solution < result)
						solution = result;
				}
				return 1 + solution;
			}
		}

		function toggleState($event, node){
			if($(event.target).next().next().hasClass('collapsing'))
				return;
			if(node.state === "expanded")
				node.state = "collapsed";
			else if(node.state === "collapsed")
				node.state = "expanded";
		}
	}
})

.controller("NestableController",function($scope){
	$scope.list = [{
			"name":"LI 1",
			"children":[{
				"name":"LI 1.1",
				"children":[
					{"name":"LI 1.1.1"}
				]
			}]
		},{
			"name":"LI 2",
			"children":[{
				"name":"LI 2.1",
				"children":[
					{"name":"LI 2.1.1"}
				]
			},{
				"name":"LI 2.2",
				"children":[
					{"name":"LI 2.2.3"}
				]
			}]
		}]
});