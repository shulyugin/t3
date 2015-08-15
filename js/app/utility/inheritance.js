define([], function (){

	function inherits(childCtor, parentCtor){
		function TempCtor(){
		}

		TempCtor.prototype = parentCtor.prototype;
		childCtor.superClass = parentCtor.prototype;
		childCtor.prototype = new TempCtor();
		childCtor.prototype.constructor = childCtor;

		Object.keys(parentCtor).forEach(function (staticField){
			if(!childCtor.hasOwnProperty(staticField)){
				childCtor[staticField] = parentCtor[staticField];
			}
		})
	}

	function getSuperPrototype(ctor){
		return ctor.superClass.constructor.prototype;
	}

	return {
		inherits         : inherits,
		getSuperPrototype: getSuperPrototype
	};
});
