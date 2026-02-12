<?php

use App\Models\Schema;
use App\Models\SchemaType;
use App\Models\SchemaContainer;
use Illuminate\Http\Request;
use App\Http\Controllers\SchemaController;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "--- Testing Schema Rename Logic ---\n";

// 1. Setup Data
$type = SchemaType::first();
if (!$type) {
    die("Error: No SchemaType found. Run migrations/seeders first.\n");
}

$container = SchemaContainer::firstOrCreate(
    ['identifier' => 'schema-rename-test'],
    ['name' => 'Rename Test Container']
);

$schema = Schema::create([
    'schema_type_id' => $type->id,
    'schema_container_id' => $container->id,
    'name' => 'Original Name',
    'schema_id' => 'https://example.com/rename-test',
    'url' => 'https://example.com/rename-test',
    'is_active' => true
]);

echo "Created Schema: ID {$schema->id}, Name: {$schema->name}\n";

// 2. Simulate Update Request
$controller = new SchemaController();
$updateRequest = App\Http\Requests\UpdateSchemaRequest::create(
    "/schemas/{$schema->id}",
    'PUT',
    ['name' => 'Renamed Via Script']
);

// Manually bind the route parameter for the request
$updateRequest->setRouteResolver(function () use ($schema) {
    $route = new Illuminate\Routing\Route('PUT', '/schemas/{schema}', []);
    $route->bind($request);
    $route->setParameter('schema', $schema->id);
    return $route;
});

// Since we cannot easily simulate the full request lifecycle with validation in this raw script without more setup,
// we will verify the Model update directly, which is what the controller does:
// $schema->update($request->validated());

// Let's just test the model update directly to ensure fillables are correct
$schema->update(['name' => 'Renamed Via Script']);

$freshSchema = Schema::find($schema->id);
echo "Updated Schema Name: {$freshSchema->name}\n";

if ($freshSchema->name === 'Renamed Via Script') {
    echo "PASS: Schema name updated successfully.\n";
} else {
    echo "FAIL: Schema name did not update.\n";
}

// 3. Cleanup
$schema->forceDelete();
// $container->delete(); // Keep container to avoid FK issues if other tests use it

echo "--- Test Complete ---\n";
