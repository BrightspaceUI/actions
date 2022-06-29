# Get Maintenance Version Action

This GitHub action determines whether the current branch is for a maintenance version (e.g. `release/2022.2.x`, `1.7.x`, or `1.x`), and if so, reports the detected maintenance version (e.g. `2022.2.x`, `1.7.x`, or `1.x`).

## Using the Action

Include this action at any point before its data is required, and retrieve the data with `outputs.MAINTENANCE_VERSION` and/or `outputs.IS_MAINTENANCE_BRANCH`:

```yml
- name: Get maintenance version
  uses: BrightspaceUI/actions/get-maintenance-version@main
  id: get-maintenance-version
- name: Some other action
  run: |
    echo "Maintenance version: ${{ steps.get-maintenance-version.outputs.MAINTENANCE_VERSION }}"
    [ ${{ inputs.AUTO_MAINTENANCE_BRANCH }} == true ] && echo "Is a maintenance branch"
- name: Only runs on non-maintenance branches
  if: ${{ steps.get-maintenance-version.outputs.IS_MAINTENANCE_BRANCH != 'true' }}
  run: echo "Not a maintenance branch"
```

Outputs:
* `MAINTENANCE_VERSION`: Maintenance version of the current branch, or empty string
* `IS_MAINTENANCE_BRANCH`: Whether the current branch is a maintenance branch
