function setDefaults(server:any, next: any) {
	(async () => {
		await server.models.Role.create({
			name: 'ADMIN',
		});
		await server.models.User.create({
			username: 'admin',
			password: "admin",
			email: "admin@gmail.com",
		});
		await server.models.User.create({
			username: 'BulletproofUA',
			password: "BulletproofUA",
			email: "BulletproofUA@gmail.com",
		});
		await server.models.User.create({
			username: 'lawliet',
			password: "lawliet",
			email: "lawliet@gmail.com",
		});
		await server.models.User.create({
			username: 'Desertroper',
			password: "Desertroper",
			email: "Desertroper@gmail.com",
		});
		await server.models.User.create({
			username: 'Jason Statham',
			password: "jason_statham",
			email: "jason_statham@gmail.com",
		});
        await server.models.User.create({
			username: 'Welf_Crozzo',
			password: "Welf_Crozzo",
			email: "Welf_Crozzo@gmail.com",
		});
        await server.models.User.create({
			username: 'Aqua',
			password: "Aqua",
			email: "Aqua@gmail.com",
		});
        await server.models.User.create({
			username: 'Kirua',
			password: "Kirua",
			email: "Kirua@gmail.com",
		});
        await server.models.User.create({
			username: 'Milky_Way',
			password: "Milky_Way",
			email: "Milky_Way@gmail.com",
		});
             await server.models.User.create({
			username: 'StillHard',
			password: "StillHard",
			email: "StillHard@gmail.com",
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
