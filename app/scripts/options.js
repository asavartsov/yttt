export default { 
    baseURL: "http://ticket.infolan.org",
    filters: [
        {
            title: "Мои задачи",
            filter: "assignee: me -Resolved sort by: updated"
        },
        {
            title: "Задачи отдела",
            filter: "assignee: {Департамент Web} Timer: Start sort by: updated"
        },
    ]
};