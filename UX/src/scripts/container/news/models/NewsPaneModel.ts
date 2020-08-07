/**
 * model in the mvvm chain for the central UI of the news feature
 */
export class NewsPaneModel {  
    /**
     * model in the mvvm chain for the central UI of the deployments feature
     * @param recentBlogPost used to retrieve recent blog post     
     */
    constructor(public recentBlogPost: Array<any>) {}
}
