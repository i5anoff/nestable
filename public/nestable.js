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
		scope.recursiveTemplate = "/nestable.html";
		scope.node = {"children":scope.list};
		scope.node.coordinates = [];
		assignCoordinates();
		scope.dragStart = dragStart;
		scope.dragStop = dragStop;
		scope.dragged = dragged;
		scope.toggleState = toggleState;
		scope.draggedNode = undefined;
		var draggedElement = undefined;
		var rootElement = element;
		scope.offsetX = 0;
		scope.offsetY = 0;

		$('body').on('mouseleave', function(){if(draggedElement !== undefined)scope.$apply(dragStop);})

		function assignCoordinates(node){
			if(!node)
				node = scope.node;
			if(node.children === undefined || node.children.length === 0)
				node.state = "leaf";
			else if(node.state === "leaf")
				node.state = "expanded";
			for(i in node.children){
				if(node.children[i].state === undefined)
					node.children[i].state = "expanded";
				node.children[i].coordinates = node.coordinates.slice();
				node.children[i].coordinates.push(i);
				assignCoordinates(node.children[i]);
			}
		}

		function dragStart($event, coordinates){
			$event.stopPropagation();
			$event.preventDefault();
			draggedElement = $($event.target).closest('li');
			scope.draggedNode = getNode(coordinates);
			draggedElement.css("position","relative");
			scope.offsetX = $event.pageX;
			scope.offsetY = $event.pageY;
		}

		function dragStop($event, coordinates){
			if(coordinates !== undefined){
				$event.stopPropagation();
				if(!draggedElement)
					return;
				$event.preventDefault();
				var dropElement = getCoveringNode($event.pageX, $event.pageY);
				if(dropElement){
					var dropCoordinates = JSON.parse(dropElement.attr('data-coordinates'));
					var dropNode = getNode(dropCoordinates);
					var initialCoordinates = scope.draggedNode.coordinates.slice();
					var i = initialCoordinates.pop();
					var initialNode = getNode(initialCoordinates);

					initialNode.children.splice(i, 1);
					if(dropNode.children === undefined)
						dropNode.children = [scope.draggedNode];
					else
						dropNode.children.splice(0, 0, scope.draggedNode);
					if(scope.draggedNode.state==='collapsed')
						scope.draggedNode.state='expanded';
				
					assignCoordinates();
				}
			}
			if(draggedElement)
				draggedElement.css({'position':'static','left':'0px','top':'0px'});
			draggedElement = undefined;
			scope.draggedNode = undefined;
			scope.offsetX = 0;
			scope.offsetY = 0;
		}

		function dragged($event, coordinates){
			if(!draggedElement)
				return;
			$event.stopPropagation();
			$event.preventDefault();
			draggedElement.css({'left':5 + $event.pageX - scope.offsetX,'top':$event.pageY - scope.offsetY});
		}

		function getNode(coordinates){
			el = scope.node;
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
					if(offset.left<x && offset.top<y && offset.left+child.outerWidth()>x && offset.top+child.outerHeight()>y)
						return getCoveringNode(x,y, child) || child;
			}
			return undefined;
		}

		function toggleState(node){
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