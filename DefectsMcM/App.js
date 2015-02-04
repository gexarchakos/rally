Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
		var teams = ['Supernova'];
		this.start_date = '2015-02-02';

		this.rows = [];
		this.showTable();
		this.loadDefects(teams, this.start_date);
	},
	
	loadDefects: function(teams, start_date) {
		var defectsFilter = null;
		for(var team=0; team<teams.length; team++) {
			var tmp = Ext.create('Rally.data.wsapi.Filter', {
					property: 'Project.Name',
					operator : "=",
					value: teams[team]
				});
			if(defectsFilter===null) defectsFilter = tmp;
			else defectsFilter = defectsFilter.or(tmp);
		}
		Ext.create('Rally.data.wsapi.Store', {
			autoLoad : true,
			model: 'Defect',
			filters: defectsFilter,
			listeners: {
				load: function(store, data, success) {
					for(var i=0; i<data.length; i++) {
						console.log(data[i].data);
						//if(data[i].data.Project && data[i].data.Project!==null)
						//	console.log(data[i].data.Project._refObjectName, data[i].data.ScheduleState );
						//else
						//	console.log(data[i].data.FormattedID, " has not team");
					}
					/*
					for(var i=0; i<items.length; i++) {
						for(var v=0; v<data.length; v++) {
							if(data[v].data.Iteration._refObjectUUID==items[i].sprint._refObjectUUID && data[v].get('PlanEstimate')!==null) {
								items[i].velocities[2]+=data[v].get('PlanEstimate');
								items[i].velocities[3]+=data[v].get('PlanEstimate');
							}
						}
						this.dataRow(items[i].team.Parent.Name,items[i].team.Name,items[i].sprint.Name,items[i].velocities[1],items[i].velocities[0],items[i].velocities[2],items[i].velocities[3], items[i].sprint.satisfaction);
					}
					*/
				}
				//scope:this
			},
			fetch: ['Project', 'ScheduleState', 'CreationDate', 'AcceptedDate', 'ClosedDate', 'InProgressDate', 'OpenedDate', 'TargetDate', 'RevisionHistory', 'LastUpdateDate']
		});
		
	},
	
	dataRow: function(date, team, created_num, accepted_num, open_num) {
		var row = {
			date: date,
			team: team,
			created: creted_num,
			accepted: accepted_num,
			pending: open_num
		};
		this.rows.push(row);
		this.store.load();
	},
	
	showTable : function() {
		var me = this;
		this.store = Ext.create('Rally.data.custom.Store', {
			fields: [
				{ name : "date" ,          type : "date"},
				{ name : "team" ,          type : "string"},
				{ name : "created" ,     type : "number"},
				{ name : "accepted",    type : "number"}, 
				{ name : "opened",type : "number"}
			],
			data : this.rows
		});
		// create the grid
		this.grid = Ext.create('Rally.ui.grid.Grid', {
			// title: 'Defect Density',
			store: this.store,
			//height: height,
			columnCfgs: [
				{ text : 'Date', dataIndex: 'date', flex: 1.1},
				{ text : 'Team', dataIndex: 'team', flex: 1.1},
				{ text : "Created", dataIndex : "created", flex: 1.1},
				{ text : "Accepted/Completed", dataIndex : "accepted", flex: 1.1}, 
				{ text : "Opened", dataIndex : "opened", flex: 1.1}
			]
		});
		this.add(this.grid);
	}
});
