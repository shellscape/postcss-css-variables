// Variables that referenced in some way by the target variable
//
// `variablesUsed`: Array of string variable names that may be in the map
//
// Returns: `object`
//	 - `deps`: array of complete dependecies recursively gathered (entries from the `map`)
//	 - `hasCircularOrSelfReference`: bool of whether there is some circular or self reference of dependencies.
//	 	 - If true, the variable can't be deduced
export const gatherVariableDependencies = function (
  variablesUsed: any,
  map: any,
  _dependencyVariablesList?: any
) {
  _dependencyVariablesList = _dependencyVariablesList || [];
  let hasCircularOrSelfReference = false;

  if (variablesUsed) {
    _dependencyVariablesList = variablesUsed.reduce(
      (dependencyVariablesList: any, variableUsedName: any) => {
        const isVariableInMap = !!map[variableUsedName];
        const doesThisVarHaveCircularOrSelfReference = !isVariableInMap
          ? false
          : dependencyVariablesList.some((dep: any) =>
              map[variableUsedName].some((mapItem: any) => {
                // If already in the list, we got a circular reference
                if (dep === mapItem) {
                  return true;
                }

                return false;
              })
            );
        // Update the overall state of dependency health
        hasCircularOrSelfReference =
          hasCircularOrSelfReference || doesThisVarHaveCircularOrSelfReference;

        if (isVariableInMap && !hasCircularOrSelfReference) {
          dependencyVariablesList = dependencyVariablesList.concat(map[variableUsedName]);

          (map[variableUsedName] || []).forEach((mapItem: any) => {
            const result = gatherVariableDependencies(
              mapItem.variablesUsed,
              map,
              dependencyVariablesList
            );
            dependencyVariablesList = result.deps;
            hasCircularOrSelfReference =
              hasCircularOrSelfReference || result.hasCircularOrSelfReference;
          });
        }

        return dependencyVariablesList;
      },
      _dependencyVariablesList
    );
  }

  return {
    deps: _dependencyVariablesList,
    hasCircularOrSelfReference
  };
};
