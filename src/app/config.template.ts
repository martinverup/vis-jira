export class Config {
    private username = '';
    private password = '';

    public host = '';

    public prefix = '';

    public boardId = 0;

    public filterText = '';

    get basic(): string {
        return btoa(`${this.username}:${this.password}`);
    }

}
