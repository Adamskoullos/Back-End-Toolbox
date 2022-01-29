# Deploy on AWS

`Elastic Beanstalk` is use in the process below to launch a Node app on AWS and `CodePipeline` will be used to automatically rebuild and redeploy the app on each push to the GitHub repo.

### Create CodePipeline

1. `Pipeline name` and choose `New Service Role`
2. Add or create AWS connector to GitHub repo
3. Add an `output` option

4. Build: Skip

5. Deploy: Elastic Beanstalk:

   - On another tab and go to Elastic Beanstalk to create a new application: - Application - Key/Value tags > `PORT`
     Create and wait for this to build. Once built use the information to complete setting up the pipeline:

6.
