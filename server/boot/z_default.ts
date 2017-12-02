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
