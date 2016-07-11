# Guidelines for contributing

## Work on `dev`
Any merge request should be created from and issued to the `dev` branch.

## dist files
Keep it simple, don't commit any files in the `dist` directory, I build these files only before a release.

## Unit tests
There are very few unit tests because it's somehow difficult to setup, but please don't break them and create new ones if you can.

I won't merge any branch not passing the TravisCI build, including JShint/JSCS/SCSSlint compliance.
