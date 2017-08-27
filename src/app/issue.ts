export interface IssueType {
    id: string;
    key: string;
    name: string;
    fields: IssueFieldsType
}

export interface IssueLinkType {
    id: string;
    outwardIssue: IssueType;
    inwardIssue: IssueType;
};

export interface IssueFieldsType {
    summary: string;
    issuelinks: IssueLinkType[];
    customfield_10100: number;
    customfield_10401: { value: string; };
    epic: IssueType;
    components: { id: string; name: string; }[];
};

export class BoardType {
    issues: IssueType[];
};
