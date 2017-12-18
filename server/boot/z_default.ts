function setDefaults(server:any, next: any) {
	(async () => {
		await server.models.Role.create({
			name: 'ADMIN',
		});
		await server.models.User.create({
			username: 'admin',
			password: "admin",
			email: "admin@bar.com",
		});
		await server.models.User.create({
			username: 'admin2',
			password: "admin2",
			email: "admin2@bar.com",
		});
		await server.models.User.create({
			username: 'admin3',
			password: "admin3",
			email: "admin3@bar.com",
		});
		await server.models.User.create({
			username: 'admin4',
			password: "admin4",
			email: "admin4@bar.com",
		});
		await server.models.User.create({
			username: 'admin5',
			password: "admin5",
			email: "admin5@bar.com",
		});
        await server.models.User.create({
			username: 'admin6',
			password: "admin6",
			email: "admin6@bar.com",
		});
        await server.models.User.create({
			username: 'admin7',
			password: "admin7",
			email: "admin7@bar.com",
		});
        await server.models.User.create({
			username: 'admin8',
			password: "admin8",
			email: "admin8@bar.com",
		});
        await server.models.User.create({
			username: 'admin9',
			password: "admin9",
			email: "admin9@bar.com",
		});
             await server.models.User.create({
			username: 'admin10',
			password: "admin10",
			email: "admin10@bar.com",
		});
		await server.models.RoleMapping.create({
			roleId: '1',
			principalId: '1',
			principalType: 'USER',
		});
		await server.models.AccessToken.create({
			id: '123456',
			userId: '1',
		})
	})().then(next).catch((err:any)=>{
			console.log(err);
			throw err;
	});
}
export = setDefaults;
