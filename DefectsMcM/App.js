Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
		var teams = ['Blenders', 'Hue', 'Supernova'];
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
					//console.log(data);
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
			fetch: ['FormattedID', 'Project', 'Parent', 'ScheduleState', 'CreationDate', 'AcceptedDate', 'ClosedDate', 'InProgressDate', 'OpenedDate', 'TargetDate', 'RevisionHistory', 'LastUpdateDate', 'PlanEstimate', 'Deliverysatisfactionscore110', 'Teamstatus', 'TeamLifecycle', 'LPCVelocity', 'Release', 'ProductOwnerInvolvement15']
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
	},
	
	loadTeams: function(teams) {
		var teamsFilter = null;
		for(var team=0; team<teams.length; team++) {
			var tmp = Ext.create('Rally.data.wsapi.Filter', {
					property: 'Name',
					operator : "=",
					value: teams[team]
				});
			if(teamsFilter===null) teamsFilter = tmp;
			else teamsFilter = teamsFilter.or(tmp);
		}

		var teamStore = Ext.create('Rally.data.wsapi.Store', {
			model: 'Project',
			filters: teamsFilter,
			autoLoad: true,
			listeners: {
				load: function(teamStore, teamData, success) {
					//console.log('got data!', teamStore, teamData, success);
					this.loadSprints(teamData, this);
				},
				scope: this
			},
			fetch: ['Name']
		});
	},
	
	loadSprints: function(team_data, app) {
		var sprintsFilter = null;
		for(var team=0; team<team_data.length; team++) {
			var tmp = Ext.create('Rally.data.wsapi.Filter', {
					property: 'Project.Name',
					operator : "=",
					value: team_data[team].data.Name
				});
			if(sprintsFilter===null) sprintsFilter = tmp;
			else sprintsFilter = sprintsFilter.or(tmp);
		}
		var today = new Date();
		sprintsFilter = sprintsFilter.and(Ext.create('Rally.data.wsapi.Filter', {
				property: 'EndDate',
				operator : "<=",
				value: today
			})
		);
		Ext.create('Rally.data.wsapi.Store', {
			autoLoad : true,
			model: 'Iteration',
			filters: sprintsFilter,
			sorters: [ {property:'EndDate', direction:'DESC'}],
			listeners: {
				load: function(store, data, success) {
					var items = [];
					var storyFilter = null;
					for(var t=0; t<team_data.length; t++) {
						var program = team_data[t].data.Parent.Name;
						var team = team_data[t].data.Name;
						var j = 0;
						for(var s=0; s<data.length; s++) {
							//console.log('Sprint:', data[s].data)
							if(data[s].data.Project.Name==team) {
								//console.log('Sprint:', program, team, data[s].data.Name);
								var tmpFilter = Ext.create('Rally.data.wsapi.Filter', {
										property: 'Iteration.ObjectID',
										operator: '=',
										value: data[s].data.ObjectID
									}).and(Ext.create('Rally.data.wsapi.Filter', {
										property: 'Parent.Name',
										operator: 'Contains',
										value: 'Iteration Reporting Parent'
									}).or(Ext.create('Rally.data.wsapi.Filter', {
										property: 'ScheduleState',
										operator: '=',
										value: 'Accepted'
									}))).and(Ext.create('Rally.data.wsapi.Filter', {
										property: 'DirectChildrenCount',
										operator: '=',
										value: '0'
									}));
								if(storyFilter===null) storyFilter = tmpFilter;
								else storyFilter = storyFilter.or(tmpFilter);
								items.push({team: team_data[t].data, sprint: data[s].data,'velocities':[data[s].data.PlannedVelocity,0,0,0]});
								j++;
								if(j>=app.sprints_per_team)
									break;
							}
						}
					}
					app.loadStories(storyFilter, items);
				},
				scope : app
			},
			fetch: ['Name', 'Project', 'ObjectID','PlannedVelocity','StartDate','EndDate']
		});
	},
	
	loadStories: function(filter, items) {
		Ext.create('Rally.data.wsapi.Store', {
			autoLoad : true,
			model: 'HierarchicalRequirement',
			filters: filter,
			listeners: {
				load: function(store, data, success) {
					var defectFilter = null;
					for(var i=0; i<items.length; i++) {
						//console.log(items[i]['sprint']['Name']);
						for(var v=0; v<data.length; v++) {
							if(data[v].data.Iteration._refObjectUUID==items[i].sprint._refObjectUUID) {
								if(data[v].data.Parent && data[v].data.Parent!==null && data[v].data.Parent._refObjectName.indexOf('Iteration Reporting Parent')>-1) {
									items[i].velocities[1]=data[v].get('LPCVelocity');
									items[i].sprint.satisfaction=data[v].get('Deliverysatisfactionscore110');
									
								} else {
									items[i].velocities[2]+=data[v].get('PlanEstimate');
								}
							}
						}
						var tmpFilter = Ext.create('Rally.data.wsapi.Filter', {
							property: 'Iteration.ObjectID',
							operator: '=',
							value: items[i].sprint.ObjectID
						}).and(Ext.create('Rally.data.wsapi.Filter', {
							property: 'ScheduleState',
							operator: '=',
							value: 'Accepted'
						}));
						if(defectFilter===null) defectFilter = tmpFilter;
						else defectFilter = defectFilter.or(tmpFilter);
					}
					this.loadDefects(defectFilter, items);						
				},
				scope:this
			},
			fetch: ['FormattedID', 'Parent', 'ScheduleState', 'Iteration', 'PlanEstimate', 'Deliverysatisfactionscore110', 'Teamstatus', 'TeamLifecycle', 'LPCVelocity', 'Release', 'ProductOwnerInvolvement15']
		});
		
	}
	
});
