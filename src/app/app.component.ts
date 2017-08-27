import { Component } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { BoardType, IssueType } from './issue';
import { Node, Edge, Network, Options, Data } from 'vis';
import { Config } from './config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public board: BoardType;

  private nodes: Node[];
  private edges: Edge[];
  private network: Network;
  private instance: AxiosInstance;

  constructor(private config: Config) {
    this.instance = axios.create({
      baseURL: this.config.host,
      headers: { 'Authorization': `Basic  ${this.config.basic}` }
    });
  }

  ngOnInit() {
    this.fetchBoard(this.config.boardId).then(result => {
      this.board = result;
      this.board.issues = this.board.issues.filter(link => !!link.fields.customfield_10401 && link.fields.customfield_10401.value === this.config.filterText);
      this.draw();
    });
  }

  fetchBoard(boardId: number): Promise<BoardType> {
    return this.instance.get(`/rest/agile/latest/board/${boardId}/issue`)
      .then(json => json.data);
  }

  getInwardIssues(issue: IssueType): IssueType[] {
    return !!issue.fields.issuelinks.length ?
      issue.fields.issuelinks.map(link => link.inwardIssue).filter(link => !!link && link.key.startsWith(`${this.config.prefix}-`))
      : [];
  }

  getOutwardIssues(issue: IssueType): IssueType[] {
    return !!issue.fields.issuelinks.length ?
      issue.fields.issuelinks.map(link => link.outwardIssue).filter(link => !!link && link.key.startsWith(`${this.config.prefix}-`))
      : [];
  }

  makeGraph(board: BoardType): Data {
    let data = { nodes: [], edges: [] };
    board.issues.forEach(issue => {
      const issueId = this.stripPrefix(issue.key);
      if (!data.nodes.some(n => n.id === issueId)) {
        data.nodes.push(this.makeNode(issueId, issue));
      }
      // Get inward issues
      let inward = this.getInwardIssues(issue);
      inward.forEach(i => {
        const inId = this.stripPrefix(i.key);
        if (!data.nodes.some(n => n.id === inId)) {
          data.nodes.push(this.makeNode(inId, i));
        }
        data.edges.push({
          from: inId, to: issueId, arrows: 'to'
        });
      })
      // Get outward issues
      let outward = this.getOutwardIssues(issue);
      outward.forEach(o => {
        const outId = this.stripPrefix(o.key);
        if (!data.nodes.some(n => n.id === outId)) {
          data.nodes.push(this.makeNode(outId, o));
        }
        data.edges.push({
          from: issueId, to: outId, arrows: 'to'
        });
      })
    });
    return data;
  }

  makeNode(id, issue: IssueType) {
    let points = ((issue.fields.customfield_10100 || 0) + 1) * 100;
    return {
      id: id,
      label: issue.key,
      value: points,
      title: issue.fields.summary
      + (issue.fields.components && !!issue.fields.components.length ? '<br>' + issue.fields.components[0].name : '')
      + (!!issue.fields.customfield_10100 ? '<br>' + issue.fields.customfield_10100 + ' story points' : ''),
      group: (issue.fields.components && !!issue.fields.components.length ? issue.fields.components[0].id : 0)
    };
  }

  draw() {
    let container = document.getElementById('network');
    let data = this.makeGraph(this.board);
    let options: Options = {
      nodes: {
        borderWidth: 1,
        size: 1000,
        color: {
          border: '#000',
          background: '#fff'
        },
        font: { color: '#000' },
        scaling: {
          min: 30,
          max: 300,
          label: {
            enabled: true
          }
        },
        shape: 'circle'
      },
      edges: {
        color: '#000'
      }
    };
    this.network = new Network(container, data, options);
    this.network.on('doubleClick', params => {
      this.openLink(params.nodes[0]);
    });
  }

  private stripPrefix(is: string): number {
    const s = is.split('-');
    return parseInt(s[s.length - 1], 10);
  }

  private openLink(key: string): void {
    if (!!key) {
      let win = window.open(`${this.config.host}/browse/${this.config.prefix}-${key}`, '_blank');
      win.focus();
    }
  }

}
