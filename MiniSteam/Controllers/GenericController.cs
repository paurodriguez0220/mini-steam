using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class GenericController<TEntity> : ControllerBase where TEntity : BaseEntity
    {
        protected readonly IService<TEntity> _service;

        public GenericController(IService<TEntity> service)
        {
            _service = service;
        }

        [HttpGet]
        public virtual async Task<IActionResult> GetAll()
            => Ok(await _service.GetAllAsync());

        [HttpGet("{id}")]
        public virtual async Task<IActionResult> Get(int id)
        {
            var entity = await _service.GetAsync(id);
            return entity == null ? NotFound() : Ok(entity);
        }

        [HttpPost]
        public virtual async Task<IActionResult> Create(TEntity entity)
            => Ok(await _service.CreateAsync(entity));

        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, TEntity entity)
        {
            var entityIdProperty = entity.GetType().GetProperty("Id");
            if (entityIdProperty == null || (int)entityIdProperty.GetValue(entity)! != id)
                return BadRequest();

            await _service.UpdateAsync(entity);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
