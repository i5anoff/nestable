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
		var dropElement = undefined;
		var rootElement = element;
		var placeHolder = undefined;
		var offsetX = 0;
		var offsetY = 0;
		var parentOffsetX = 0, parentOffsetY = 0;

		$('body').on('mouseleave', function(){if(draggedElement !== undefined){dragStop();}});
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
			var coord = draggedElement.attr('data-coordinates');
			if(coord === undefined)
				return;
			var node = getNode(JSON.parse(coord));
			draggedNode = node;
			draggedElement.parent().css("position","relative");
			offsetX = $event.pageX;
			offsetY = $event.pageY;
			parentOffsetY = draggedElement.position().top + 5;
			parentOffsetX = draggedElement.position().left + 15;
			draggedElement.css({"position":"absolute","z-index":"3"});
			refreshDraggedElement($event);
			draggedElement.width(placeHolder.width());
		}

		function dragStop($event){
			if($event === undefined)
				return;
			$event.stopPropagation();
			if(!draggedElement || !draggedNode)
				return;

			if(dropElement){
				var dropCoordinates = JSON.parse(dropElement.attr('data-coordinates'));
				if(dropCoordinates === undefined)
					return;
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
				dropElement = undefined;
			}
			if(draggedElement){
				draggedElement.css({'position':'static','left':'0px','top':'0px','z-index':1});
				draggedElement.parent().css("position","static");
				placeHolder.remove();
			}
			placeHolder = undefined;
			draggedElement = undefined;
			draggedNode = undefined;
			offsetX = 0;
			offsetY = 0;
			parentOffsetX = 0;
			parentOffsetY = 0;
		}

		function dragged($event){
			if(!draggedElement)
				return;
			$event.stopPropagation();
			$event.preventDefault();
			refreshDraggedElement($event);
		}

		function refreshDraggedElement($event){
			var newX = parentOffsetX + $event.pageX - offsetX;
			var newY = parentOffsetY + $event.pageY - offsetY;
			if(!placeHolder){
				placeHolder = $('<li class="placeholder">');
				placeHolder.insertAfter(draggedElement);
				placeHolder.height(draggedElement.height());
			} else {
				var newDropElement = getLiByPoint($event.pageX, $event.pageY);
				if(newDropElement && newDropElement !== dropElement){
					dropElement = newDropElement;
					placeHolder.detach().prependTo(newDropElement.children('ol'));
					if(placeHolder.offset().top < draggedElement.parent().offset().top)
						newY = newY - placeHolder.height();
				}
			}
			draggedElement.css({'left': newX,'top': newY});
		}

		function getNode(coordinates){
			var el = scope.node;
			for(i in coordinates)
				el = el.children[coordinates[i]];
			return el;
		}

		function getLiByPoint(x, y, parent){
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
				if(child.hasClass('placeholder'))
					continue;
				offset = child.offset();
				if(child.attr('data-coordinates') !== draggedElement.attr('data-coordinates'))
					if(offset.left < x 
							&& offset.top < y 
							&& offset.left+child.outerWidth() > x 
							&& offset.top+child.outerHeight() > y)
						return getLiByPoint(x,y, child) || child;
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
					{"name":"LI 2.1.1"},
					{"name":"LI 2.1.2"}

				]
			},{
				"name":"LI 2.2",
				"children":[
					{"name":"LI 2.2.3"}
				]
			}]
		}]
});