import {Request, Response, NextFunction} from 'express';




export class SubmissionController {
    constructor() {}

     handleSubmission = async (req: Request, res: Response, next: NextFunction) => {
        //Perform different actions based on the request, such as validating input, processing the submission, etc.
        //For example there are a lot of thing that need to  be done first is to check here if the exact question is already submitted by the user and if it is then we can just return the previous result instead of re-submitting it to the judge0 api.
        //You can also check if the user has already submitted the same code for the same question and if it is then we can just return the previous result instead of re-submitting it to the judge0 api.
        //This helps to avoid unnecessary API calls and reduces the load on the server.
        //After these it has to check that your github is configured or not (which we can do before submission reaches this hanlder) and if it is not then we can just return an error message to the user and ask them to configure their github first.

        //After all these check we can proceed to process the submission and send it to the judge0 api and then return the result to the user.

        console.log('request body', req.body);
        res.status(200).json({ success: true, message: 'Submission received', data: req.body });
    }
}