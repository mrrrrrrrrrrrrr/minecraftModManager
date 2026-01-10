using System.Text;
using BLL.Interfaces;
using BLL.Services;
using DAL.EF;
using DAL.Entities;
using DAL.Interfaces;
using DAL.Repositories;
using DTO.Collection;
using DTO.Developer;
using DTO.Difficulty;
using DTO.Focus;
using DTO.Mod;
using DTO.ModLoader;
using DTO.Tag;
using DTO.ModVersion;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.FileProviders;
using DTO.DownloadSource;
using DTO.ModGallery;

var builder = WebApplication.CreateBuilder(args);

// Подключение к БД
string connection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationContext>(options => options.UseNpgsql(connection));

// Конфигурация JWT
var tokenSettings = builder.Configuration.GetSection("TokenSettings");
var secretKey = Environment.GetEnvironmentVariable("SECRET") 
    ?? tokenSettings["SecretKey"] 
    ?? throw new InvalidOperationException("JWT secret is not configured");

// Добавление Identity
builder.Services
    .AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationContext>()
    .AddDefaultTokenProviders();

// Репозитории
builder.Services.AddTransient<IRepository<ModDto, CreateModDto, UpdateModDto>, ModRepository>();
builder.Services.AddTransient<IRepository<TagDto, CreateTagDto, UpdateTagDto>, TagRepository>();
builder.Services.AddTransient<IRepository<ModVersionDto, CreateModVersionDto, UpdateModVersionDto>, VersionRepository>();
builder.Services.AddTransient<IRepository<ModLoaderDto, CreateModLoaderDto, UpdateModLoaderDto>, ModLoaderRepository>();
builder.Services.AddTransient<IRepository<DeveloperDto, CreateDeveloperDto, UpdateDeveloperDto>, DeveloperRepository>();
builder.Services.AddTransient<IRepository<CollectionDto, CreateCollectionDto, UpdateCollectionDto>, CollectionRepository>();
builder.Services.AddTransient<IRepository<DifficultyDto, CreateDifficultyDto, UpdateDifficultyDto>, DifficultyRepository>();
builder.Services.AddTransient<IRepository<FocusDto, CreateFocusDto, UpdateFocusDto>, FocusRepository>();
builder.Services.AddTransient<IRepository<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto>, DownloadSourceRepository>();
builder.Services.AddTransient<IRepository<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto>, ModGalleryRepository>();

// Сервисы
builder.Services.AddScoped<IService<ModDto, CreateModDto, UpdateModDto>, ModService>();
builder.Services.AddScoped<IService<TagDto, CreateTagDto, UpdateTagDto>, TagService>();
builder.Services.AddScoped<IService<ModVersionDto, CreateModVersionDto, UpdateModVersionDto>, VersionService>();
builder.Services.AddScoped<IService<ModLoaderDto, CreateModLoaderDto, UpdateModLoaderDto>, ModLoaderService>();
builder.Services.AddScoped<IService<DeveloperDto, CreateDeveloperDto, UpdateDeveloperDto>, DeveloperService>();
builder.Services.AddScoped<IService<CollectionDto, CreateCollectionDto, UpdateCollectionDto>, CollectionService>();
builder.Services.AddScoped<IService<DifficultyDto, CreateDifficultyDto, UpdateDifficultyDto>, DifficultyService>();
builder.Services.AddScoped<IService<FocusDto, CreateFocusDto, UpdateFocusDto>, FocusService>();
builder.Services.AddScoped<IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto>, DownloadSourceService>();
builder.Services.AddScoped<IService<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto>, ModGalleryService>();

// Настройка аутентификации
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = tokenSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = tokenSettings["Audience"],
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuerSigningKey = true
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 🔥 ДОБАВЛЯЕМ CORS С ПОЛИТИКОЙ ДЛЯ FormData
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 🔥 СОЗДАЕМ ПАПКИ ЕСЛИ НЕ СУЩЕСТВУЮТ
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(wwwrootPath, "uploads");
var modsPath = Path.Combine(wwwrootPath, "mods");
var modsGalleryPath = Path.Combine(wwwrootPath, "modsGallery");

if (!Directory.Exists(wwwrootPath))
    Directory.CreateDirectory(wwwrootPath);
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);
if (!Directory.Exists(modsPath))
    Directory.CreateDirectory(modsPath);
if (!Directory.Exists(modsGalleryPath))
    Directory.CreateDirectory(modsGalleryPath);

Console.WriteLine($"📁 Папка uploads: {uploadsPath}");
Console.WriteLine($"📁 Папка mods: {modsPath}");

// Создаем тестового пользователя
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    if (await userManager.FindByNameAsync("UserOleg") == null)
    {
        var user = new User 
        { 
            UserName = "UserOleg",
            Email = "user@example.com",
            Nickname = "UserOleg" 
        };
        var result = await userManager.CreateAsync(user, "AboBa13666-");
        
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"Error: {error.Description}");
            }
        }
        else
        {
            Console.WriteLine("✅ Пользователь UserOleg создан");
        }
    }
}

// 🔥 НАСТРАИВАЕМ MIDDLEWARE PIPELINE В ПРАВИЛЬНОМ ПОРЯДКЕ
app.UseRouting();

// 🔥 CORS ДОЛЖЕН БЫТЬ ПОСЛЕ UseRouting() И ДО UseAuthentication()
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// 🔥 НАСТРАИВАЕМ СТАТИЧЕСКИЕ ФАЙЛЫ
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(modsPath),
    RequestPath = "/mods"
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(modsGalleryPath),
    RequestPath = "/modsGallery"
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

Console.WriteLine("🚀 Сервер запущен!");
Console.WriteLine("📁 Папка для модов: " + modsPath);
Console.WriteLine("📁 Папка для изображений: " + uploadsPath);

app.Run();